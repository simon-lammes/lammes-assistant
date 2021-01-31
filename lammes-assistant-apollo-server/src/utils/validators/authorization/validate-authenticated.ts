import {AuthenticationError, UserInputError} from "apollo-server";
import {JwtPayload} from "../../jwt-utils";

/**
 * Validates that the request is made by an authenticated user.
 * @return the userId of authenticated user
 * @throws AuthenticationError if request is not authenticated
 */
export function validateAuthenticated(jwtPayload?: JwtPayload): number {
  const userId = jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  return userId;
}
