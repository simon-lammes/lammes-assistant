import {inputObjectType} from "@nexus/schema";

export const GroupFilterDefinition = inputObjectType({
  name: 'GroupFilterDefinition',
  definition(t) {
    t.nullable.list.nonNull.int('groupIds');
  },
});
