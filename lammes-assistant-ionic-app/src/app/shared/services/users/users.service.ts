import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  settingsUpdatedTimestamp: string;
}

export interface UserFilter {
  query?: string | null;
}

const userFragment = gql`
  fragment UserFragment on User {
    id,
    username,
    firstName,
    lastName
  }
`;

const filteredUsersQuery = gql`
  query FilteredUsers($query: String) {
    filteredUsers(query: $query) {
      ...UserFragment
    }
  },
  ${userFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  readonly currentUser$ = this.apollo.watchQuery<{ me: User }>({
    query: gql`
      query GetCurrentUserQuery {
        me {
          ...UserFragment
        }
      },
      ${userFragment}
    `
  })
  .valueChanges.pipe(
    map(({data}) => data.me)
  );

  constructor(
    private apollo: Apollo
  ) {
  }

  getFilteredUsers(usersFilter: UserFilter): Observable<any> {
    return this.apollo.watchQuery<{ filteredUsers: User[] }>({
      query: filteredUsersQuery,
      variables: usersFilter
    }).valueChanges.pipe(
      map(result => result.data.filteredUsers)
    );
  }

  getCachedUserById(userId: number): User {
    try {
      return this.apollo.client.readFragment({
        id: `User:${userId}`,
        fragment: userFragment
      });
    } catch (e) {
      return undefined;
    }
  }
}
