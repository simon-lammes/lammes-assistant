import {UserInputError} from "apollo-server";

export function validateLength(minLength: number, validatedObject: { [key: string]: string }) {
  for (const key of Object.keys(validatedObject)) {
    const value = validatedObject[key];
    if (!value || value.length < minLength) {
      throw new UserInputError(`Property ${key} cannot be empty.`);
    }
  }
}
