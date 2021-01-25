import {inputObjectType} from "@nexus/schema";
import {LanguageCodeEnumType} from "./language-code";

export const ExerciseFilter = inputObjectType({
  name: 'ExerciseFilter',
  definition(t) {
    t.nullable.list.nonNull.int('creatorIds');
    t.nullable.list.nonNull.string('labels');
    t.nullable.list.nonNull.field('languageCodes', {type: LanguageCodeEnumType});
    t.nullable.int('maximumCorrectStreak');
  },
});
