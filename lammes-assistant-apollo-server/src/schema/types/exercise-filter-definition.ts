import {inputObjectType, objectType} from "@nexus/schema";

export const exerciseFilterObjectType = objectType({
  name: 'ExerciseFilter',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.creatorId();
    t.model.exerciseFilterDefinition();
  }
});

export const ExerciseFilterDefinition = inputObjectType({
  name: 'ExerciseFilterDefinition',
  definition(t) {
    t.nullable.list.nonNull.int('creatorIds');
    t.nullable.list.nonNull.string('labels');
    t.nullable.list.nonNull.field('languageCodes', {type: 'LanguageCode'});
    t.nullable.int('maximumCorrectStreak');
  },
});
