import {Environment} from './environment-interface';

/**
 * This environment is used when you develop locally and want this application to hit your locally running GraphQL server.
 * This is useful for when you are working on features that require both changes to the frontend and backend.
 * You use this configuration with 'npm run start:local'.
 */
export const environment: Environment = {
  production: false,
  uriGraphQl: 'http://localhost:4000',
  networkRetryDelayMilliseconds: 3000
};
