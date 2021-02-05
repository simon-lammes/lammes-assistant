import {inputObjectType, objectType} from "@nexus/schema";

export const groupObjectType = objectType({
  name: 'Group',
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.description();
  }
});

export const groupInputType = inputObjectType({
  name: 'GroupInput',
  definition(t) {
    t.nonNull.string('name');
    t.nullable.string('description');
  }
});

