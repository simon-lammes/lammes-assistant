import {inputObjectType, nonNull} from "@nexus/schema";

export const PossibleAnswer = nonNull(inputObjectType({
  name: 'PossibleAnswer',
  description: 'For exercise type "multiselect"',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.boolean('correct');
    t.nullable.string('explanation', {description: 'Explains why an answer is correct or incorrect.'});
  },
}));
