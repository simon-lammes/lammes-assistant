// Cannot be placed in environment.ts because this file is replaced with environment.prod.ts at build time
// which results in this interface unexpectedly not being available. It is a weird error.
// You could probably get away with putting this interface in environment.prod.ts but I want to play it save.

import {Settings} from '../app/settings/settings.service';

/**
 * Defines the whole configuration for this Angular app. The environment constant is usually an Angular thing without interface but
 * I wanted this interface to make use of strong typing and to make sure that the environment and environment.prod
 * both define the same fields.
 */
export interface Environment {
  /**
   * Specifying whether the running application is running in production.
   */
  production: boolean;

  /**
   * The uri of the GraphQL endpoint used by this application.
   */
  uriGraphQl: string;

  /**
   * When a network request fails, we should retry. But we should wait a bit before we retry so that we do not waste resources.
   * This constant specifies in milliseconds for how long we wait.
   */
  networkRetryDelayMilliseconds: number;

  /**
   * The settings that are used when the user has not yet created his own settings.
   */
  defaultSettings: Settings;
}
