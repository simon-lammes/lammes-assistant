import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ApolloCache} from '@apollo/client/core';

/**
 * The biggest date possible. It is in the future.
 */
const maxDate = new Date(8640000000000000);

/**
 * The data that is needed for creating a note.
 */
export interface CreateNoteData {
  title: string;
  description?: string;
}

export interface Note {
  id: number;
  title: string;
  description?: string;
  noteLabels: {
    label: {
      id: string;
      title: string;
    };
  }[];
  resolvedTimestamp?: string;
  startTimestamp?: string;
  deadlineTimestamp?: string;
  updatedTimestamp: string;
}

export interface NoteInput {
  title?: string;
  description?: string;
  labels?: string[];
  startTimestamp?: string;
  deadlineTimestamp?: string;
}


/**
 * Specifies which data we want when querying or mutating notes. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const noteFragment = gql`
  fragment NoteFragment on Note {
    id,
    title,
    description,
    resolvedTimestamp,
    startTimestamp,
    updatedTimestamp,
    deadlineTimestamp,
    noteLabels {
      label {
        title
      }
    }
  }
`;

const usersDeferredNotesQuery = gql`
  query UsersDeferredNotes {
    myDeferredNotes {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const usersPendingNotesQuery = gql`
  query UsersPendingNotes {
    myPendingNotes {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const usersResolvedNotesQuery = gql`
  query UsersResolvedNotes {
    myResolvedNotes {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const fetchNoteQuery = gql`
  query FetchNote($noteId: Int!) {
    note(id: $noteId) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const createNoteMutation = gql`
  mutation CreateNote($noteInput: NoteInput!) {
    createNote(noteInput: $noteInput) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const resolveNotesMutation = gql`
  mutation ResolveNotes($noteId: Int!) {
    resolveNote(noteId: $noteId) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const reopenNoteMutation = gql`
  mutation ReopenNote($noteId: Int!) {
    reopenNote(noteId: $noteId) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const deleteNoteMutation = gql`
  mutation DeleteNote($noteId: Int!) {
    deleteNote(noteId: $noteId) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

const editNoteMutation = gql`
  mutation EditNote($id: Int!, $noteInput: NoteInput!) {
    editNote(id: $id, noteInput: $noteInput) {
      ...NoteFragment
    }
  }
  ${noteFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  readonly usersDeferredNotes$ = this.apollo.watchQuery<{ myDeferredNotes: Note[] }>({query: usersDeferredNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myDeferredNotes)
  );

  readonly usersPendingNotes$ = this.apollo.watchQuery<{ myPendingNotes: Note[] }>({query: usersPendingNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myPendingNotes)
  );

  readonly usersResolvedNotes$ = this.apollo.watchQuery<{ myResolvedNotes: Note[] }>({query: usersResolvedNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myResolvedNotes)
  );

  constructor(
    private apollo: Apollo,
  ) {
  }

  /**
   * This method does not only send a request to the server in order to create a new note but it also takes care of caching.
   * This is one thing I love about GraphQL so far. We make sure that the query for fetching the users notes gets automatically updated
   * without even refetching the query. Our client is intelligent enough to know that when we add a note,
   * this note gets appended the users notes. If you want to know more about this concept, I recommend this article
   * https://www.apollographql.com/docs/angular/features/cache-updates/
   * and I highly recommend this video https://www.youtube.com/watch?v=zWhVAN4Tg6M
   */
  async createNote(data: { noteInput: NoteInput }) {
    await this.apollo.mutate({
      mutation: createNoteMutation,
      variables: data,
      // I faced a problem with optimisticResponse that I could not fix which is why I do not provide it anymore.
      // If you find a solution, please apply it. It would be nicer if we made use of the optimisticResponse.
      // The problem is that we need our result data to have an id. This is important because we need the notes' id,
      // otherwise we wouldn't explicitly request it in our graphql query. However, we cannot predict the id of a
      // newly created note for the optimisticResponse. Not providing an id when it is expected leads to errors.
      optimisticResponse: undefined,
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteChanged(cache, mutationResult.data.createNote);
      }
    }).toPromise();
  }

  async resolveNote(note: Note) {
    await this.apollo.mutate<{ resolveNote: Note }, { noteId: number }>({
      mutation: resolveNotesMutation,
      variables: {noteId: note.id},
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteChanged(cache, mutationResult.data.resolveNote);
      }
    }).toPromise();
  }

  async reopenNote(note: Note) {
    await this.apollo.mutate<{ reopenNote: Note }, { noteId: number }>({
      mutation: reopenNoteMutation,
      variables: {noteId: note.id},
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteChanged(cache, mutationResult.data.reopenNote);
      }
    }).toPromise();
  }

  async deleteNote(note: Note) {
    await this.apollo.mutate<{ deleteNote: Note }, { noteId: number }>({
      mutation: deleteNoteMutation,
      variables: {noteId: note.id},
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteChanged(cache, mutationResult.data.deleteNote, true);
      }
    }).toPromise();
  }

  fetchNote(noteId: number): Observable<Note> {
    return this.apollo.watchQuery<{ note: Note }>({
      query: fetchNoteQuery,
      variables: {noteId}
    }).valueChanges.pipe(
      map(({data}) => data.note)
    );
  }

  editNote(args: { id: number, noteInput: NoteInput }) {
    return this.apollo.mutate<{ editNote: Note }>({
      mutation: editNoteMutation,
      variables: args,
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteChanged(cache, mutationResult.data.editNote);
      }
    });
  }

  /**
   * Updates all related query caches when the user changed a note. Changes that can be handled by this method include:
   * create, update, delete. The updating tactic is as follows: We take the cache for a query and remove the changed note.
   * Then we check whether the changed note belongs into the result of that query. If yes, we insert it back and sort the result.
   * The sorting must orient to how the server sorts. For example, the server sorts the deferred notes by their start date, so
   * when updating the cache we must also sort by start date.
   * @param cache cache
   * @param changedNote The note that has either been created or updated.
   * @param hasChangedNoteBeenDeleted set this exactly then to true when you call this method after you deleted a note
   */
  private updateCacheAfterNoteChanged(
    cache: ApolloCache<any>,
    changedNote: Note,
    hasChangedNoteBeenDeleted = false
  ) {
    const now = new Date();
    // Update cache for deffered notes.
    try {
      const deferredCache = cache.readQuery({query: usersDeferredNotesQuery}) as { myDeferredNotes: Note[] };
      const deferredNotes = deferredCache.myDeferredNotes;
      const startDate = changedNote.startTimestamp ? new Date(changedNote.startTimestamp) : undefined;
      const shouldEditedNoteBeIncluded = !hasChangedNoteBeenDeleted && (!startDate || startDate > now) && !changedNote.resolvedTimestamp;
      const updatedDeferredNotes = deferredNotes.filter(x => x.id !== changedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(changedNote);
        updatedDeferredNotes.sort((a, b) => {
          const comparisonByStartTime = new Date(a.startTimestamp ?? maxDate).getTime() - new Date(b.startTimestamp ?? maxDate).getTime();
          if (comparisonByStartTime !== 0) {
            return comparisonByStartTime;
          }
          return a.title.localeCompare(b.title);
        });
      }
      cache.writeQuery({query: usersDeferredNotesQuery, data: {myDeferredNotes: updatedDeferredNotes}});
    } catch (e) {
    }
    // Update cache for pending notes.
    try {
      const pendingCache = cache.readQuery({query: usersPendingNotesQuery}) as { myPendingNotes: Note[] };
      const pendingNotes = pendingCache.myPendingNotes;
      const startDate = changedNote.startTimestamp ? new Date(changedNote.startTimestamp) : undefined;
      const shouldEditedNoteBeIncluded = !hasChangedNoteBeenDeleted && startDate && !changedNote.resolvedTimestamp && startDate <= now;
      const updatedDeferredNotes = pendingNotes.filter(x => x.id !== changedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(changedNote);
        updatedDeferredNotes.sort((a, b) => {
          const firstComparison = new Date(a.deadlineTimestamp ?? maxDate).getTime() - new Date(b.deadlineTimestamp ?? maxDate).getTime();
          if (firstComparison !== 0) {
            return firstComparison;
          }
          return a.title.localeCompare(b.title);
        });
      }
      cache.writeQuery({query: usersPendingNotesQuery, data: {myPendingNotes: updatedDeferredNotes}});
    } catch (e) {
    }
    // Update cache for resolved notes.
    try {
      const resolvedCache = cache.readQuery({query: usersResolvedNotesQuery}) as { myResolvedNotes: Note[] };
      const resolvedNotes = resolvedCache.myResolvedNotes;
      const shouldEditedNoteBeIncluded = !hasChangedNoteBeenDeleted && !!changedNote.resolvedTimestamp;
      const updatedDeferredNotes = resolvedNotes.filter(x => x.id !== changedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(changedNote);
        updatedDeferredNotes.sort((a, b) => {
          const firstComparison = new Date(b.resolvedTimestamp).getTime() - new Date(a.resolvedTimestamp).getTime();
          if (firstComparison !== 0) {
            return firstComparison;
          }
          return a.title.localeCompare(b.title);
        });
      }
      cache.writeQuery({query: usersResolvedNotesQuery, data: {myResolvedNotes: updatedDeferredNotes}});
    } catch (e) {
    }
  }
}
