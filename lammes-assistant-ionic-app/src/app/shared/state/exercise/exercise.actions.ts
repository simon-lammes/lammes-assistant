import {HydratedExercise} from '../../services/exercise/exercise.service';

export enum ExerciseCreationFailureReason {
  LanguageUndetermined
}

export class SaveExercise {
  public static readonly type = '[Exercise] Save Exercise';

  /**
   * @param editedExerciseId falsy if new exercise is created
   */
  constructor(public exercise: HydratedExercise, public editedExerciseId: number) {
  }
}

export class ExerciseSaved {
  public static readonly type = '[API] Exercise Created';

  /**
   * @param editedExerciseId falsy if new exercise is created
   */
  constructor(public editedExerciseId: number) {
  }
}

export class ExerciseSavingFailed {
  public static readonly type = '[API] Exercise Creation Failed';

  constructor(public exercise: HydratedExercise, public editedExerciseId: number, public reason: ExerciseCreationFailureReason) {
  }
}
