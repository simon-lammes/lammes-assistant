import {inputObjectType, nonNull} from "@nexus/schema";

export const CustomFile = nonNull(inputObjectType({
  name: 'CustomFile',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.string('name');
  },
}));
