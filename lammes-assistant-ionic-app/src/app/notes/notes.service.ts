import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';

/**
 * The data that is needed for creating a note.
 */
export interface CreateNoteData {
  text: string;
}

export interface Note {
  text: string;
}

const usersNotesQuery = gql`
    query UsersNotes {
        myNotes {
            text
        }
    }
`;

const createNoteMutation = gql`
    mutation CreateNote($text: String!) {
        createNote(text: $text) {
            text
        }
    }
`;

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  readonly usersNotes$ = this.apollo.watchQuery<{ myNotes: Note[] }>({query: usersNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myNotes)
  );

  constructor(
    private apollo: Apollo
  ) {
  }

  /**
   * This method does not only send a request to the server in order to create a new note but it also takes care of caching.
   * This is one thing I love about GraphQL so far. We make sure that the query for fetching the users notes gets automatically updated
   * without even refetching the query. Our client is intelligent enough to know that when we add a note,
   * this note gets appended the users notes. If you want to know more about this concept, I recommend this article
   * https://www.apollographql.com/docs/angular/features/cache-updates/
   * and I highly recommend this video https://www.youtube.com/watch?v=zWhVAN4Tg6M
   * We want the queries to update immediately even when the network is slow, thich is why we use work with an optimistic response.
   * You can read more about optimistic responses here: https://www.apollographql.com/docs/angular/features/optimistic-ui/
   */
  async createNote(data: CreateNoteData) {
    await this.apollo.mutate({
      mutation: createNoteMutation,
      variables: data,
      optimisticResponse: {
        __typename: 'Mutation',
        createNote: {
          __typename: 'Note',
          text: data.text
        }
      },
      update: (cache, mutationResult) => {
        const cachedData = cache.readQuery({query: usersNotesQuery}) as { myNotes: Note[] };
        const newNote = (mutationResult.data as { createNote: Note }).createNote;
        const updatedCacheData = {
          myNotes: [...cachedData.myNotes, newNote]
        };
        cache.writeQuery({query: usersNotesQuery, data: updatedCacheData});
      }
    }).toPromise();
  }
}
