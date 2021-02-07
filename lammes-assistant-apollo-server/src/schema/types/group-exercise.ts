import {objectType} from "@nexus/schema";

export const groupExerciseObjectType = objectType({
  name: 'GroupExercise',
  definition(t) {
    t.model.groupId();
    t.model.exerciseId();
  }
});
