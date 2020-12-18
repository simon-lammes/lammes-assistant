import {ApolloError} from "apollo-server";

/**
 * Generates an error for the situation in which an entity cannot be created because it would conflict with an already existing entity
 */
export function generateConflictError(message: string, extensions?: Record<string, unknown>): ApolloError {
  return new ApolloError(message, "CONFLICT", extensions)
}
