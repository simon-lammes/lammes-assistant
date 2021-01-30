import {inputObjectType, objectType} from "@nexus/schema";

export const ExerciseCooldownInputType = inputObjectType({
  name: 'ExerciseCooldownInput',
  definition(t) {
    t.nonNull.int('days');
    t.nonNull.int('hours');
    t.nonNull.int('minutes');
  },
});

export const ExerciseCooldownType = objectType({
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
