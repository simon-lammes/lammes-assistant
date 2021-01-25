import {objectType} from "@nexus/schema";

export const applicationConfiguration = objectType({
  name: 'ApplicationConfiguration',
  definition(t) {
    t.nonNull.int('minPasswordLength', {description: 'How long the password of new users is required to be'});
    t.nonNull.list.nonNull.string('allowedFileTypes', {description: 'Which types of files is the user allowed to create?'})
  }
});
