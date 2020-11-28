import {ApolloError} from "apollo-server";

/**
 * This error is used when a resource could not be found.
 */
export function generateNotFoundError(message: string, extensions?: Record<string, unknown>): ApolloError {
  return new ApolloError(message, "NOT_FOUND", extensions)
}
