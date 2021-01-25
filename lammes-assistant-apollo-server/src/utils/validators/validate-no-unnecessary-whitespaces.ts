import {generateUnnecessaryWhitespacesError} from "../../custom-errors/unnecessary-whitespaces-error";
import {UserInputError} from "apollo-server";

export function validateNoUnnecessaryWhitespaces(validatedObject: { [key: string]: string }) {
  for (const key of Object.keys(validatedObject)) {
    const value = validatedObject[key];
    if (value.includes('  ') || value.startsWith(' ') || value.endsWith(' ')) {
      throw generateUnnecessaryWhitespacesError('title');
    }
  }
}
