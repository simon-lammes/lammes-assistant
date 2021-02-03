import {objectType} from "@nexus/schema";

export const exerciseObjectType = objectType({
  name: 'Exercise',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.creatorId();
    t.model.versionTimestamp();
    t.model.markedForDeletionTimestamp();
    t.model.exerciseLabels();
    t.model.languageCode();
    t.model.exerciseType();
  }
});
