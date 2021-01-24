import {objectType} from "@nexus/schema";

export const experienceObjectType = objectType({
  name: 'Experience',
  definition(t) {
    t.model.exerciseId();
    t.model.learnerId();
    t.model.exercise();
    t.model.lastStudiedTimestamp();
    t.model.correctStreak();
  }
});
