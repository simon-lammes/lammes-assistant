import {ExerciseResult, HydratedExercise} from '../../services/exercise/exercise.service';

export class RegisterExerciseResult {
  public static readonly type = '[Study] Register Exercise Result';
  constructor(public hydratedExercise: HydratedExercise, public exerciseResult: ExerciseResult) { }
}
