import {inputObjectType} from "@nexus/schema";
import {PromptSolutionInputType} from "./prompt-solution";
import {CustomFile} from "./custom-file";
import {PossibleAnswer} from "./possible-answer";
import {ExerciseType} from "./exercise-type";

export interface CustomFile {
  name: string;
  value: string;
}

export interface PossibleAnswer {
  value: string;
  correct: boolean;
}

/**
 * An exercise with all the information belonging to it. A regular "Exercise" only contains light metadata and it saved
 * in the relational database while an "Hydrated Exercise" is a storage-intensive object saved in DigitalOcean Spaces.
 */
export interface HydratedExercise {
  id: number;
  /**
   * Should be usable to determine whether an exercise changed without looking into the "storage-intensive" parts of the exercise.
   */
  versionTimestamp: string;
  title: string;
  assignment: string;
  solution: string;
  files: CustomFile[];
  labels: string[];
  exerciseType: 'standard' | 'trueOrFalse' | 'multiselect' | 'ordering';
  isStatementCorrect?: boolean;
  possibleAnswers?: PossibleAnswer[];
  orderingItems?: string[];
  languageCode: string;
}

export const HydratedExerciseInputType = inputObjectType({
  name: 'HydratedExerciseInput',
  definition(t) {
    t.nonNull.string('title');
    t.nonNull.string('assignment');
    t.nonNull.string('solution');
    t.nonNull.field('exerciseType', {type: ExerciseType});
    t.nonNull.list.field('files', {type: CustomFile});
    t.nonNull.list.nonNull.string('labels');
    t.nonNull.field('languageCode', {type: 'LanguageCode'});
    t.nullable.boolean('isStatementCorrect');
    t.nullable.list.field('possibleAnswers', {type: PossibleAnswer});
    t.nullable.list.nonNull.string('orderingItems');
    t.nullable.list.nonNull.field('promptSolutions', {type: PromptSolutionInputType});
  },
});

