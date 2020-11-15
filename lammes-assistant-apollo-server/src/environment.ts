/**
 * Contains all variables configured in the '.env' file.
 */
export interface Environment {
  DATABASE_URL: string;
  /**
   * A secret string that can be used to sign JWT tokens.
   */
  SECRET: string;
}

const result = require('dotenv').config()
if (result.error) {
  throw result.error;
}
export const environment: Environment = result.parsed;
