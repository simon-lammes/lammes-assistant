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
