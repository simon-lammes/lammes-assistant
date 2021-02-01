import {inputObjectType} from "@nexus/schema";

export const ExerciseFilter = inputObjectType({
  name: 'ExerciseFilter',
  definition(t) {
    t.nullable.list.nonNull.int('creatorIds');
    t.nullable.list.nonNull.string('labels');
    t.nullable.list.nonNull.field('languageCodes', {type: 'LanguageCode'});
    t.nullable.int('maximumCorrectStreak');
  },
});
