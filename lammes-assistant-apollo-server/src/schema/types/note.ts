import {inputObjectType, objectType} from "@nexus/schema";
import {ProtectionLevelEnumType} from "./protection-level";

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
    t.model.groupNotes();
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
    t.nullable.list.nonNull.field('addedGroupAccesses', {type: GroupAccessInput});
    t.nullable.list.nonNull.field('editedGroupAccesses', {type: GroupAccessInput});
    t.nullable.list.nonNull.int('removedGroupIds');
  },
});

export const GroupAccessInput = inputObjectType({
  name: 'GroupAccessInput',
  definition(t) {
    t.nonNull.int('groupId');
    t.nonNull.field('protectionLevel', {type: ProtectionLevelEnumType})
  }
});
