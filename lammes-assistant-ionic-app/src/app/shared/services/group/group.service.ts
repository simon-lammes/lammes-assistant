import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {User} from '../users/user.service';

export interface NewGroupMembership {
  memberId: number;
}

export interface GroupMembership {
  user: User;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  groupMemberships?: GroupMembership[];
}

interface GroupInput {
  name: string;
  description?: string;
}

const groupFragment = gql`
  fragment GroupFragment on Group {
    id,
    name,
    description,
    groupMemberships {
      user {
        id,
        username,
        profilePictureDownloadLink,
        firstName,
        lastName
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  myGroups$: Observable<Group[]> = this.apollo.watchQuery<{myGroups: Group[]}>({
    query: gql`
      query MyGroups {
        myGroups {
          ...GroupFragment
        }
      },
      ${groupFragment}
    `
  }).valueChanges.pipe(
    map(result => result.data.myGroups)
  );

  constructor(
    private apollo: Apollo
  ) {
  }

  createGroup(group: GroupInput) {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateGroup($group: GroupInput!) {
          createGroup(group: $group) {
            ...GroupFragment
          }
        },
        ${groupFragment}
      `,
      refetchQueries: ['MyGroups'],
      variables: {group}
    }).toPromise();
  }

  async editGroup(id: number, group: GroupInput) {
    return this.apollo.mutate({
      mutation: gql`
        mutation EditGroup($id: Int!, $group: GroupInput!) {
          editGroup(id: $id, group: $group) {
            ...GroupFragment
          }
        },
        ${groupFragment}
      `,
      variables: {id, group}
    }).toPromise();
  }

  addGroupMemberships(id: number, addedMemberships: NewGroupMembership[]) {
    return this.apollo.mutate({
      mutation: gql`
        mutation AddGroupMemberships($id: Int!, $addedMemberships: [NewGroupMembership!]!) {
          addGroupMemberships(id: $id, addedMemberships: $addedMemberships) {
            ...GroupFragment
          }
        },
        ${groupFragment}
      `,
      variables: {
        id,
        addedMemberships
      },
    }).toPromise();
  }

  fetchGroupById(id: number | undefined): Observable<Group | undefined> {
    if (!id) {
      return of(undefined);
    }
    return this.myGroups$.pipe(
      map(groups => {
        return groups.find(x => x.id === id);
      })
    );
  }
}
