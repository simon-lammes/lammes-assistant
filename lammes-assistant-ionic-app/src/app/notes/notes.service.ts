import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

/**
 * The data that is needed for creating a note.
 */
export interface CreateNoteData {
  text: string;
}

export interface Note {
  id: number;
  text: string;
  description?: string;
  resolvedTimestamp?: string;
}

const usersPendingNotesQuery = gql`
    query UsersPendingNotes {
        myPendingNotes {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

const usersResolvedNotesQuery = gql`
    query UsersResolvedNotes {
        myResolvedNotes {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

const fetchNoteQuery = gql`
    query FetchNote($noteId: Int!) {
        note(id: $noteId) {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

const createNoteMutation = gql`
    mutation CreateNote($text: String!) {
        createNote(text: $text) {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

const resolveNotesMutation = gql`
    mutation ResolveNotes($noteId: Int!) {
        resolveNote(noteId: $noteId) {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

const editNoteMutation = gql`
    mutation EditNote($id: Int!, $text: String!, $description: String!) {
        editNote(id: $id, text: $text, description: $description) {
            id,
            text,
            description,
            resolvedTimestamp
        }
    }
`;

@Injectable({
  providedIn: 'root'
})
export class NotesService {

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
          myPendingNotes: [...cachedData.myPendingNotes, newNote]
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
        // Update the cache for the pending notes.
        const cachedPendingNotes = cache.readQuery({query: usersPendingNotesQuery}) as { myPendingNotes: Note[] };
        const updatedCachedPendingNotes = {
          myPendingNotes: cachedPendingNotes.myPendingNotes.filter(x => x.id !== note.id)
        };
        cache.writeQuery({query: usersPendingNotesQuery, data: updatedCachedPendingNotes});

        // Update the cache for the resolved notes.
        try {
          const cachedResolvedNotes = cache.readQuery({query: usersResolvedNotesQuery}) as { myResolvedNotes: Note[] };
          const resolvedNote = mutationResult.data.resolveNote;
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

  editNote(args: { id: number, text: string, description: string }) {
    return this.apollo.mutate({
      mutation: editNoteMutation,
      variables: {...args},
    });
  }
}
