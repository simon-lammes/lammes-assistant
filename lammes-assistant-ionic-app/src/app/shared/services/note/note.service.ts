import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

export interface Note {
  id: number;
  title: string;
  description?: string;
  noteLabels: {
    label: {
      id: string;
      title: string;
    };
  }[];
  groupNotes: {
    groupId: number;
    protectionLevel: string;
  }[];
  resolvedTimestamp?: string;
  startTimestamp?: string;
  deadlineTimestamp?: string;
  updatedTimestamp: string;
}

export interface NoteInput {
  title?: string;
  description?: string;
  labels?: string[];
  startTimestamp?: string;
  deadlineTimestamp?: string;
  addedGroupAccesses?: GroupAccess[];
  editedGroupAccesses?: GroupAccess[];
  removedGroupIds?: number[];
}

export interface NoteFilter {
  labels?: string[];
}

export interface GroupAccess {
  groupId: number;
  protectionLevel: string;
}

/**
 * Specifies which data we want when querying or mutating notes. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const noteFragment = gql`
    fragment NoteFragment on Note {
        id,
        title,
        description,
        resolvedTimestamp,
        startTimestamp,
        updatedTimestamp,
        deadlineTimestamp,
        noteLabels {
            label {
                title
            }
        },
        groupNotes {
            groupId,
            protectionLevel
        }
    }
`;

const myFilteredNotes = gql`
    query MyFilteredNotes($filter: NoteFilterDefinition!) {
        myFilteredNotes(filter: $filter) {
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
    mutation CreateNote($noteInput: NoteInput!) {
        createNote(noteInput: $noteInput) {
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

const reopenNoteMutation = gql`
    mutation ReopenNote($noteId: Int!) {
        reopenNote(noteId: $noteId) {
            ...NoteFragment
        }
    }
    ${noteFragment}
`;

const deleteNoteMutation = gql`
    mutation DeleteNote($noteId: Int!) {
        deleteNote(noteId: $noteId) {
            ...NoteFragment
        }
    }
    ${noteFragment}
`;

const editNoteMutation = gql`
    mutation EditNote($id: Int!, $noteInput: NoteInput!) {
        editNote(id: $id, noteInput: $noteInput) {
            ...NoteFragment
        }
    }
    ${noteFragment}
`;

const myNoteToReview = gql`
    query MyNoteToReview {
        myNoteToReview {
            ...NoteFragment
        }
    }
    ${noteFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  myNoteToReview$ = this.apollo.watchQuery<{ myNoteToReview: Note | null }>({
    query: myNoteToReview
  }).valueChanges.pipe(
    map(result => result.data.myNoteToReview)
  );

  constructor(
    private apollo: Apollo,
  ) {
  }

  async createNote(data: { noteInput: NoteInput }) {
    await this.apollo.mutate({
      mutation: createNoteMutation,
      refetchQueries: ['MyNoteToReview', 'MyFilteredNotes'],
      variables: data,
    }).toPromise();
  }

  async resolveNote(note: Note) {
    await this.apollo.mutate<{ resolveNote: Note }, { noteId: number }>({
      mutation: resolveNotesMutation,
      refetchQueries: ['MyNoteToReview', 'MyFilteredNotes'],
      variables: {noteId: note.id}
    }).toPromise();
  }

  async reopenNote(note: Note) {
    await this.apollo.mutate<{ reopenNote: Note }, { noteId: number }>({
      mutation: reopenNoteMutation,
      refetchQueries: ['MyNoteToReview', 'MyFilteredNotes'],
      variables: {noteId: note.id}
    }).toPromise();
  }

  async deleteNote(note: Note) {
    await this.apollo.mutate<{ deleteNote: Note }, { noteId: number }>({
      mutation: deleteNoteMutation,
      refetchQueries: ['MyNoteToReview', 'MyFilteredNotes'],
      variables: {noteId: note.id}
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

  editNote(args: { id: number, noteInput: NoteInput }) {
    return this.apollo.mutate<{ editNote: Note }>({
      mutation: editNoteMutation,
      refetchQueries: ['MyNoteToReview', 'MyFilteredNotes'],
      variables: args
    });
  }

  fetchFilteredNotes(filter: NoteFilter) {
    return this.apollo.watchQuery<{ myFilteredNotes: Note[] }>({
      query: myFilteredNotes,
      variables: {filter},
    }).valueChanges.pipe(
      map(result => result.data.myFilteredNotes)
    );
  }
}
