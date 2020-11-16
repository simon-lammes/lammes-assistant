import * as dotenv from 'dotenv';
import {DotenvParseOptions} from "dotenv";

/**
 * Contains all variables configured in the '.env' file.
 */
export interface Environment extends DotenvParseOptions {
  DATABASE_URL: string;
  /**
   * A secret string that can be used to sign JWT tokens.
   */
  SECRET: string;
}

const result = dotenv.config()
if (result.error) {
  throw result.error;
}
export const environment: Environment = result.parsed as unknown as Environment;
