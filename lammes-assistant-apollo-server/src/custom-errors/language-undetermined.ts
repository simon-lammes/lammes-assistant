import {ApolloError} from "apollo-server";

/**
 * This error is used when a resource could not be found.
 */
export function generateLanguageUndeterminedError(message = 'Language (code) was not provided by you and could not be determined.', extensions?: Record<string, unknown>): ApolloError {
  return new ApolloError(message, "LANGUAGE_UNDETERMINED", extensions)
}
