import {inputObjectType} from "@nexus/schema";

export const UserFilterDefinition = inputObjectType({
  name: 'UserFilterDefinition',
  definition(t) {
    t.nullable.string('query');
    t.nullable.list.nonNull.int('userIds');
  }
});
