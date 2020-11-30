import {Environment} from './environment-interface';

export const environment: Environment = {
  production: true,
  // For production, we use our server instance deployed on DigtalOcean App Plattform.
  uriGraphQl: 'https://lammes-assistant-5m7y3.ondigitalocean.app/api',
  networkRetryDelayMilliseconds: 3000
};
