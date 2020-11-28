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
  description: string | undefined;
}

const usersNotesQuery = gql`
    query UsersNotes {
        myPendingNotes {
            id,
            text,
            description
        }
    }
`;

const fetchNoteQuery = gql`
    query FetchNote($noteId: Int!) {
        note(id: $noteId) {
            id,
            text,
            description
        }
    }
`;

const createNoteMutation = gql`
    mutation CreateNote($text: String!) {
        createNote(text: $text) {
            id,
            text,
            description
        }
    }
`;

const resolveNotesMutation = gql`
    mutation ResolveNotes($noteIds: [Int!]!) {
        resolveNotes(noteIds: $noteIds)
    }
`;

const editNoteMutation = gql`
    mutation EditNote($id: Int!, $text: String!, $description: String!) {
        editNote(id: $id, text: $text, description: $description) {
            id,
            text,
            description
        }
    }
`;

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  readonly usersNotes$ = this.apollo.watchQuery<{ myPendingNotes: Note[] }>({query: usersNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myPendingNotes)
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
        const cachedData = cache.readQuery({query: usersNotesQuery}) as { myPendingNotes: Note[] };
        const newNote = (mutationResult.data as { createNote: Note }).createNote;
        const updatedCacheData = {
          myPendingNotes: [...cachedData.myPendingNotes, newNote]
        };
        cache.writeQuery({query: usersNotesQuery, data: updatedCacheData});
      }
    }).toPromise();
  }

  async checkOffNotes(checkedOffNoteIds: number[]) {
    if (checkedOffNoteIds.length === 0) {
      return;
    }
    await this.apollo.mutate({
      mutation: resolveNotesMutation,
      variables: {
        noteIds: checkedOffNoteIds
      },
      optimisticResponse: {
        data: {
          resolveNotes: new Date()
        }
      },
      update: (cache) => {
        const cachedData = cache.readQuery({query: usersNotesQuery}) as { myPendingNotes: Note[] };
        const updatedCacheData = {
          myPendingNotes: cachedData.myPendingNotes.filter(x => !checkedOffNoteIds.includes(x.id))
        };
        cache.writeQuery({query: usersNotesQuery, data: updatedCacheData});
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
