import {PluginDefinition} from "apollo-server-core/src/types";
import {
  BaseContext,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
  ValueOrPromise
} from "apollo-server-types";
import {GraphQLRequestListener} from "apollo-server-plugin-base/src/index";

/**
 * This is my custom logger that I use to log all encountered errors to the console.
 * It is inspired by the following documentation: https://www.apollographql.com/docs/apollo-server/monitoring/metrics/
 */
export const myLogger: PluginDefinition = {
  requestDidStart(): GraphQLRequestListener<BaseContext> | void {
    return {
      didEncounterErrors(requestContext: GraphQLRequestContextDidEncounterErrors<BaseContext>): ValueOrPromise<void> {
        console.error(requestContext.errors);
      }
    }
  }
};
