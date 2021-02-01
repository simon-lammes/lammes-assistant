import {inputObjectType} from "@nexus/schema";

export const PromptSolutionInputType = inputObjectType({
  name: 'PromptSolution',
  definition(t) {
    t.nonNull.string('value', {description: 'one possible answer to the exercise\'s assignement'});
  },
});
