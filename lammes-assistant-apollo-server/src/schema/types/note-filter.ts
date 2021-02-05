import {inputObjectType} from "@nexus/schema";

export const NoteFilterDefinition = inputObjectType({
  name: 'NoteFilterDefinition',
  definition(t) {
    t.nullable.list.nonNull.string('labels');
    t.nullable.list.nonNull.string('noteStatus');
  }
});
