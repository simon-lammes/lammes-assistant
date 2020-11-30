import * as dotenv from 'dotenv';
import {DotenvParseOptions} from 'dotenv';

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
  console.warn('Nodes library dotenv has not found a .env file for configuration. ' +
    'This is no problem when the environment variables are configured from outside, which is usually the case in docker containers for example.');
}
export const environment: Environment = process.env as unknown as Environment;
