import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay, startWith, switchMap} from 'rxjs/operators';
import {AuthenticationService} from '../authentication/authentication.service';
import _ from 'lodash';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  settingsUpdatedTimestamp: string;
  profilePictureDownloadLink?: string;
}

interface PictureInput {
  content: string;
  type: string;
  name: string;
}

export interface UserFilter {
  userIds?: number[];
  query?: string | null;
}

export const userFragment = gql`
  fragment UserFragment on User {
    id,
    username,
    firstName,
    lastName,
    settingsUpdatedTimestamp,
    profilePictureDownloadLink
  }
`;

const filteredUsersQuery = gql`
  query FilteredUsers($userFilter: UserFilterDefinition!) {
    filteredUsers(userFilter: $userFilter) {
      ...UserFragment
    }
  },
  ${userFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class UserService {

  readonly currentUser$: Observable<User> = this.authenticationService.isUserAuthenticated$.pipe(
    // This observable depends on the user being authenticated.
    filter(isUserAuthenticated => isUserAuthenticated),
    switchMap(() => this.apollo.watchQuery<{ me: User }>({
      query: gql`
        query GetCurrentUserQuery {
          me {
            ...UserFragment
          }
        },
        ${userFragment}
      `
    }).valueChanges),
    map(({data}) => data.me),
    startWith(null as User),
    shareReplay(1)
  );

  readonly myProfilePicture$ = this.currentUser$.pipe(
    map(user => user.profilePictureDownloadLink),
    distinctUntilChanged((x, y) => _.isEqual(x, y))
  );

  constructor(
    private apollo: Apollo,
    private authenticationService: AuthenticationService
  ) {
  }

  getFilteredUsers(userFilter: UserFilter): Observable<any> {
    return this.apollo.watchQuery<{ filteredUsers: User[] }>({
      query: filteredUsersQuery,
      variables: {userFilter}
    }).valueChanges.pipe(
      map(result => result.data.filteredUsers)
    );
  }

  setProfilePicture(picture: PictureInput) {
    return this.apollo.mutate({
      mutation: gql`
        mutation SetProfilePicture($picture: PictureInput!) {
          setProfilePicture(picture: $picture)
        }
      `,
      refetchQueries: ['GetCurrentUserQuery'],
      variables: {picture}
    }).toPromise();
  }
}
