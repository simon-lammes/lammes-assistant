import {Environment} from './environment-interface';

export const environment: Environment = {
  production: true,
  // For Android debugging, we use these production settings. To connect the emulated android device to the computers localhost,
  // we have to replace localhost with 10.0.2.2. Once the server is deployed in the internet, we should replace this value.
  uriGraphQl: 'http://10.0.2.2:4000/'
};
