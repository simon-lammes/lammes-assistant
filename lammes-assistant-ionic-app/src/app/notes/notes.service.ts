import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ApolloCache, FetchResult} from '@apollo/client/core';

/**
 * The biggest date possible. It is in the future.
 */
const maxDate = new Date(8640000000000000);

/**
 * The data that is needed for creating a note.
 */
export interface CreateNoteData {
  text: string;
  description?: string;
}

export interface Note {
  id: number;
  text: string;
  description?: string;
  resolvedTimestamp?: string;
  startTimestamp?: string;
  deadlineTimestamp?: string;
  updatedTimestamp: string;
}

/**
 * Specifies which data we want when querying or mutating notes. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const noteFragment = gql`
    fragment NoteFragment on Note {
        id,
        text,
        description,
        resolvedTimestamp,
        startTimestamp,
        updatedTimestamp,
        deadlineTimestamp
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
    mutation CreateNote($text: String!, $description: String) {
        createNote(text: $text, description: $description) {
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

const editNoteMutation = gql`
    mutation EditNote($id: Int!, $text: String!, $description: String!, $startTimestamp: String, $deadlineTimestamp: String) {
        editNote(id: $id, text: $text, description: $description, startTimestamp: $startTimestamp, deadlineTimestamp: $deadlineTimestamp) {
            ...NoteFragment
        }
    }
    ${noteFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class NotesService {

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
  async createNote(data: CreateNoteData) {
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
        const cachedData = cache.readQuery({query: usersPendingNotesQuery}) as { myPendingNotes: Note[] };
        const newNote = (mutationResult.data as { createNote: Note }).createNote;
        const updatedCacheData = {
          myPendingNotes: [newNote, ...cachedData.myPendingNotes]
        };
        cache.writeQuery({query: usersPendingNotesQuery, data: updatedCacheData});
      }
    }).toPromise();
  }

  async resolveNote(note: Note) {
    await this.apollo.mutate<{ resolveNote: Note }, { noteId: number }>({
      mutation: resolveNotesMutation,
      variables: {noteId: note.id},
      update: (cache, mutationResult) => {
        this.updateCacheWhenNoteWasResolved(cache, mutationResult);
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

  editNote(args: { id: number, text: string, description: string, startTimestamp?: string | null }) {
    return this.apollo.mutate<{ editNote: Note }>({
      mutation: editNoteMutation,
      variables: {...args},
      update: (cache, mutationResult) => {
        this.updateCacheAfterNoteWasEdited(cache, mutationResult);
      }
    });
  }

  /**
   * This method is responsible for updating the cache whenever a note was resolved by the user.
   * This concretely means that the note must now be included in the query that delivers the **resolved** notes.
   * Furthermore, the note must be removed from all query caches that deliver **not resolved** notes.
   */
  private updateCacheWhenNoteWasResolved(
    cache: ApolloCache<{ resolveNote: Note }>,
    mutationResult: FetchResult<{ resolveNote: Note }>
  ) {
    const resolvedNote = mutationResult.data.resolveNote;
    // Try to update the cache for the deferred notes. Will fail, if this query was not yet cached.
    try {
      const cachedDeferredNotes = cache.readQuery({query: usersDeferredNotesQuery}) as { myDeferredNotes: Note[] };
      const updatedCachedDeferredNotes = {
        myDeferredNotes: cachedDeferredNotes.myDeferredNotes.filter(x => x.id !== resolvedNote.id)
      };
      cache.writeQuery({query: usersDeferredNotesQuery, data: updatedCachedDeferredNotes});
    } catch (e) {
      // Do nothing.
    }

    // Try to update the cache for the pending notes. Will fail, if this query was not yet cached.
    try {
      const cachedPendingNotes = cache.readQuery({query: usersPendingNotesQuery}) as { myPendingNotes: Note[] };
      const updatedCachedPendingNotes = {
        myPendingNotes: cachedPendingNotes.myPendingNotes.filter(x => x.id !== resolvedNote.id)
      };
      cache.writeQuery({query: usersPendingNotesQuery, data: updatedCachedPendingNotes});
    } catch (e) {
      // Do nothing.
    }

    // Try to update the cache for the resolved notes. Will fail, if query is not yet cached.
    try {
      const cachedResolvedNotes = cache.readQuery({query: usersResolvedNotesQuery}) as { myResolvedNotes: Note[] };
      const updatedCachedResolvedNotes = {
        myResolvedNotes: [resolvedNote, ...cachedResolvedNotes.myResolvedNotes]
      };
      cache.writeQuery({query: usersResolvedNotesQuery, data: updatedCachedResolvedNotes});
    } catch (e) {
      // If the query that we are updating the cache for does is not yet cached, readQuery will throw an exception.
      // In this case, we do not need to update the cache because this query is not yet cached.
      // Thus, we can just catch and ignore this error.
    }
  }

  /**
   * Updates all related query caches when the user changed a note.
   * The updating tactic is as follows: We take the cache for a query and remove the edited note.
   * Then we check whether the edited note belongs into the result of that query. If yes, we insert it back and sort the result.
   * The sorting must orient to how the server sorts. For example, the server sorts the deferred notes by their start date, so
   * when updating the cache we must also sort by start date.
   */
  private updateCacheAfterNoteWasEdited(
    cache: ApolloCache<{ editNote: Note }>,
    mutationResult: FetchResult<{ editNote: Note }>
  ) {
    const editedNote = mutationResult.data.editNote;
    const now = new Date();
    // Update cache for deffered notes.
    try {
      const deferredCache = cache.readQuery({query: usersDeferredNotesQuery}) as { myDeferredNotes: Note[] };
      const deferredNotes = deferredCache.myDeferredNotes;
      const startDate = editedNote.startTimestamp ? new Date(editedNote.startTimestamp) : undefined;
      const shouldEditedNoteBeIncluded = (!startDate || startDate > now) && !editedNote.resolvedTimestamp;
      const updatedDeferredNotes = deferredNotes.filter(x => x.id !== editedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(editedNote);
        updatedDeferredNotes.sort((a, b) => {
          const comparisonByStartTime = new Date(a.startTimestamp ?? maxDate).getTime() - new Date(b.startTimestamp ?? maxDate).getTime();
          if (comparisonByStartTime !== 0) {
            return comparisonByStartTime;
          }
          return a.text.localeCompare(b.text);
        });
      }
      cache.writeQuery({query: usersDeferredNotesQuery, data: {myDeferredNotes: updatedDeferredNotes}});
    } catch (e) {
    }
    // Update cache for pending notes.
    try {
      const pendingCache = cache.readQuery({query: usersPendingNotesQuery}) as { myPendingNotes: Note[] };
      const pendingNotes = pendingCache.myPendingNotes;
      const startDate = editedNote.startTimestamp ? new Date(editedNote.startTimestamp) : undefined;
      const shouldEditedNoteBeIncluded = startDate && !editedNote.resolvedTimestamp && startDate <= now;
      const updatedDeferredNotes = pendingNotes.filter(x => x.id !== editedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(editedNote);
        updatedDeferredNotes.sort((a, b) => {
          const firstComparison = new Date(a.deadlineTimestamp ?? maxDate).getTime() - new Date(b.deadlineTimestamp ?? maxDate).getTime();
          if (firstComparison !== 0) {
            return firstComparison;
          }
          return a.text.localeCompare(b.text);
        });
      }
      cache.writeQuery({query: usersPendingNotesQuery, data: {myPendingNotes: updatedDeferredNotes}});
    } catch (e) {
    }
    // Update cache for resolved notes.
    try {
      const resolvedCache = cache.readQuery({query: usersResolvedNotesQuery}) as { myResolvedNotes: Note[] };
      const resolvedNotes = resolvedCache.myResolvedNotes;
      const shouldEditedNoteBeIncluded = !!editedNote.resolvedTimestamp;
      const updatedDeferredNotes = resolvedNotes.filter(x => x.id !== editedNote.id);
      if (shouldEditedNoteBeIncluded) {
        updatedDeferredNotes.push(editedNote);
        updatedDeferredNotes.sort((a, b) => {
          const firstComparison = new Date(b.resolvedTimestamp).getTime() - new Date(a.resolvedTimestamp).getTime();
          if (firstComparison !== 0) {
            return firstComparison;
          }
          return a.text.localeCompare(b.text);
        });
      }
      cache.writeQuery({query: usersResolvedNotesQuery, data: {myResolvedNotes: updatedDeferredNotes}});
    } catch (e) {
    }
  }
}
