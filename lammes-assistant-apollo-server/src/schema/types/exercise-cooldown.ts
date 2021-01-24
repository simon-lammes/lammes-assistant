import {inputObjectType} from "@nexus/schema";

export const ExerciseCooldown = inputObjectType({
  name: 'ExerciseCooldown',
  definition(t) {
    t.nonNull.int('days');
    t.nonNull.int('hours');
    t.nonNull.int('minutes');
  },
});
