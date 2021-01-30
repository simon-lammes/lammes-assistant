// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {Environment} from './environment-interface';

/**
 * This environment is used when you develop locally but want this application to hit the remotely hosted GraphQL server.
 * This is useful for when you do not have the GraphQL server locally set up or it is not running.
 * You can start local testing with this configuration with 'npm run start'.
 */
export const environment: Environment = {
  production: false,
  uriGraphQl: 'https://lammes-assistant-5m7y3.ondigitalocean.app/api',
  networkRetryDelayMilliseconds: 3000,
  defaultSettings: {
    exerciseCooldown: {
      days: 0,
      hours: 2,
      minutes: 0
    },
    theme: 'system',
    settingsUpdatedTimestamp: undefined
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
