import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

export interface Group {
  id: number;
  name: string;
  description?: string;
}

interface GroupInput {
  name: string;
  description?: string;
}

const groupFragment = gql`
  fragment GroupFragment on Group {
    id,
    name,
    description
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
}
