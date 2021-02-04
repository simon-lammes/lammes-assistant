import {objectType} from "@nexus/schema";

export const NoteLabel = objectType({
  name: 'NoteLabel',
  definition(t) {
    t.model.noteId();
    t.model.labelId();
    t.model.label();
  }
});
