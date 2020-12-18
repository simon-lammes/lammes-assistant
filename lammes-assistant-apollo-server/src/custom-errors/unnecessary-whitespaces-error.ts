import {ApolloError} from "apollo-server";

/**
 * Generates an error for the situation in which the client sent unnecessary whitespaces. Examples: ['a ', ' a', 'a  b']
 * This error indicates that the client is not validating user input correctly.
 * It should not be the responsibility of the server to correct such aspects -> Please throw this error when necessary and do not "correct" bad requests by the client on the server-side.
 */
export function generateUnnecessaryWhitespacesError(propertyName: string, extensions?: Record<string, unknown>): ApolloError {
  return new ApolloError(`The property '${propertyName}' contains unnecessary whitespaces. Unnecessary whitespaces are at the start or end of the string or whitespaces next to each other like here '  '. It should not be the responsibility of the server to correct such aspects.`, "UNNECESSARY_WHITESPACES", extensions)
}
