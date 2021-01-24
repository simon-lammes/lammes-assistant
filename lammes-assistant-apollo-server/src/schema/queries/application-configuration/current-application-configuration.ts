import {queryField} from "@nexus/schema";
import {applicationConfiguration} from "../../types/application-configuration";

export const currentApplicationConfiguration = queryField('currentApplicationConfiguration', {
  type: applicationConfiguration,
  resolve: (root, args, {applicationConfiguration}) => {
    return applicationConfiguration;
  }
});
