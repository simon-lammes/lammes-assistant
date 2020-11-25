import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(
    private apollo: Apollo
  ) { }

  readonly usersNotes$ = this.apollo.watchQuery<{myNotes: Note[]}>({query: usersNotesQuery}).valueChanges.pipe(
    map(({data}) => data.myNotes)
  );
}
