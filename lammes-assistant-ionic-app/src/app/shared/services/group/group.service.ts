import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {User} from '../users/user.service';

export type GroupMemberRole = 'owner' | 'admin' | 'member';

export interface NewGroupMembership {
  memberId: number;
}

export interface GroupMembership {
  role: GroupMemberRole;
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

const groupMembershipFragment = gql`
  fragment GroupMembershipFragment on GroupMembership {
    groupId,
    memberId,
    role,
    user {
      id,
      username,
      profilePictureDownloadLink,
      firstName,
      lastName
    }
  }
`;

const groupFragment = gql`
  fragment GroupFragment on Group {
    id,
    name,
    description,
    groupMemberships {
      ...GroupMembershipFragment
    }
  },
  ${groupMembershipFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  myGroups$: Observable<Group[]> = this.apollo.watchQuery<{ myGroups: Group[] }>({
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

  addGroupMemberships(args: {id: number, addedMemberships: NewGroupMembership[], role: GroupMemberRole}) {
    return this.apollo.mutate({
      mutation: gql`
        mutation AddGroupMemberships($id: Int!, $addedMemberships: [NewGroupMembership!]!, $role: GroupMemberRole!) {
          addGroupMemberships(id: $id, addedMemberships: $addedMemberships, role: $role) {
            ...GroupFragment
          }
        },
        ${groupFragment}
      `,
      variables: args,
    }).toPromise();
  }

  removeGroupMemberships(id: number, removedMemberIds: number[]) {
    return this.apollo.mutate({
      mutation: gql`
        mutation RemoveGroupMemberships($id: Int!, $removedMemberIds: [Int!]!) {
          removeGroupMemberships(id: $id, removedMemberIds: $removedMemberIds) {
            ...GroupFragment
          }
        },
        ${groupFragment}
      `,
      variables: {
        id,
        removedMemberIds
      },
    }).toPromise();
  }

  editGroupMembership(args: { groupId: number, memberId: number, role: GroupMemberRole }) {
    return this.apollo.mutate({
      mutation: gql`
        mutation EditGroupMembership($groupId: Int!, $memberId: Int!, $role: GroupMemberRole!) {
          editGroupMembership(groupId: $groupId, memberId: $memberId, role: $role) {
            ...GroupMembershipFragment
          }
        },
        ${groupMembershipFragment}
      `,
      variables: args,
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
