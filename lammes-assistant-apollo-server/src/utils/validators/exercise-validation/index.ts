import {validateExerciseFiles} from "./exercise-file-validation";
import {ApplicationConfiguration} from "../../../context";
import {CustomFile, HydratedExercise} from "../../../schema/types/hydrated-exercise";
import {validateNoUnnecessaryWhitespaces} from "../validate-no-unnecessary-whitespaces";
import {validateLength} from "../validate-length";

interface ValidatedExerciseInformation {
  title: string;
  files: CustomFile[];
}

export function validateExercise(config: ApplicationConfiguration, exercise: ValidatedExerciseInformation) {
  validateLength(1, {title: exercise.title});
  validateNoUnnecessaryWhitespaces({title: exercise.title});
  validateExerciseFiles(config, exercise.files);
}
