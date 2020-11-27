import {ApolloError} from "apollo-server";

/**
 * This error is used when the authentication was successful but the user is now authorized (not allowed) to perform a 
 * certain action.
 */
export function generateAuthorizationError(message: string, extensions?: Record<string, unknown>): ApolloError {
  return new ApolloError(message, "AUTHORIZATION", extensions)
}
