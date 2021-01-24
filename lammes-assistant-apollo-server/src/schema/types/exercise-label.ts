import {objectType} from "@nexus/schema";

export const ExerciseLabel = objectType({
  name: 'ExerciseLabel',
  definition(t) {
    t.model.exerciseId();
    t.model.labelId();
    t.model.label();
  }
});
