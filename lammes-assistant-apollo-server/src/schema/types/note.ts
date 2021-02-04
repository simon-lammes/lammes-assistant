import {inputObjectType, objectType} from "@nexus/schema";

export const noteObjectType = objectType({
  name: 'Note',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.description();
    t.model.updatedTimestamp();
    t.model.startTimestamp();
    t.model.deadlineTimestamp();
    t.model.resolvedTimestamp();
    t.model.creatorId();
    t.model.creator();
    t.model.noteLabels();
  },
});

export const NoteInput = inputObjectType({
  name: 'NoteInput',
  definition(t) {
    t.nullable.string('title');
    t.nullable.string('description');
    t.nullable.string('startTimestamp');
    t.nullable.string('deadlineTimestamp');
    t.nullable.list.nonNull.string('labels');
  },
});
