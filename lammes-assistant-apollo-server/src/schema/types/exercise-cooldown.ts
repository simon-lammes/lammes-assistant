import {inputObjectType} from "@nexus/schema";

export const ExerciseCooldownType = inputObjectType({
  name: 'ExerciseCooldown',
  definition(t) {
    t.nonNull.int('days');
    t.nonNull.int('hours');
    t.nonNull.int('minutes');
  },
});

export interface ExerciseCooldown {
  days: number;
  hours: number;
  minutes: number;
}
