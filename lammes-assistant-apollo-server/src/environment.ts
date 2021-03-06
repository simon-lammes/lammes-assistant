import * as dotenv from 'dotenv';
import {DotenvParseOptions} from 'dotenv';

/**
 * Contains all variables configured in the '.env' file.
 */
export interface Environment extends DotenvParseOptions {

  /**
   * A url to the Postgres database you want this server to use.
   * It must have the schema specified in [prisma.schema](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-apollo-server/prisma/schema.prisma).
   * Syntax: postgresql://<username>:<password>@<uri>:<port>/<database-name>
   */
  DATABASE_URL: string;

  /**
   * A secret string that can be used to sign JWT tokens.
   */
  SECRET: string;

  /**
   * The url to the s3 compatible object storage.
   */
  SPACES_ENDPOINT: string;

  /**
   * Documented [here](https://www.digitalocean.com/docs/spaces/resources/s3-sdk-examples/).
   */
  SPACES_KEY: string;

  /**
   * Documented [here](https://www.digitalocean.com/docs/spaces/resources/s3-sdk-examples/).
   */
  SPACES_SECRET: string;

  /**
   * Key for [language detection API](https://detectlanguage.com/)
   * We decided to use this API instead of a library because it achieved better results in tests.
   */
  DETECT_LANGUAGE_API_KEY: string;
}

const result = dotenv.config()
if (result.error) {
  console.warn('Nodes library dotenv has not found a .env file for configuration. ' +
    'This is no problem when the environment variables are configured from outside, which is usually the case in docker containers for example.');
}
export const environment: Environment = process.env as unknown as Environment;
