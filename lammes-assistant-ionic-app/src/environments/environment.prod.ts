import {Environment} from './environment-interface';

export const environment: Environment = {
  production: true,
  // For production, we use our server instance deployed on DigitalOcean App Plattform.
  uriGraphQl: 'https://lammes-assistant-5m7y3.ondigitalocean.app/api',
  networkRetryDelayMilliseconds: 3000,
  defaultSettings: {
    exerciseCooldown: {
      days: 0,
      hours: 2,
      minutes: 0
    },
    settingsUpdatedTimestamp: undefined
  }
};
