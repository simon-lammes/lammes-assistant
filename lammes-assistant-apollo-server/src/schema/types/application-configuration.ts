import {objectType} from "@nexus/schema";

export const applicationConfiguration = objectType({
  name: 'ApplicationConfiguration',
  definition(t) {
    t.int('minPasswordLength', {description: 'How long the password of new users is required to be'});
  }
});
