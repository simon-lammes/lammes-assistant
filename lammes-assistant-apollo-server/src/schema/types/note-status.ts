import {enumType} from "@nexus/schema";

export const NoteStatus = enumType({
  name: 'NoteStatus',
  members: ['deferred', 'pending', 'resolved']
});
