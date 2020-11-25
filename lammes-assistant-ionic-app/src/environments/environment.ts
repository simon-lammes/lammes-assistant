// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

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
}

/**
 * The environment that is used when locally testing the application. In production it is replaced with environment.production.
 */
export const environment: Environment = {
  production: false,
  uriGraphQl: 'http://localhost:4000'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
