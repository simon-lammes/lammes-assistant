import {ApplicationConfiguration} from "../../../context";
import {UserInputError} from "apollo-server";
import {CustomFile} from "../../../schema/types/hydrated-exercise";

/**
 * Throws any ApolloError if something is wrong with the exercise files.
 */
export function validateExerciseFiles({allowedFileTypes}: ApplicationConfiguration, files: CustomFile[]): void {
  for (const file of files) {
    const hasValidFileType = allowedFileTypes.some(fileType => file.value.startsWith(`data:${fileType};`));
    if (!hasValidFileType) {
      throw new UserInputError(`Invalid file type for file ${file.name}`);
    }
  }
}
