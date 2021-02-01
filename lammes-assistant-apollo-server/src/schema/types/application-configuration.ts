import {objectType} from "@nexus/schema";
import {SettingsObjectType} from "./settings";

export const applicationConfiguration = objectType({
  name: 'ApplicationConfiguration',
  definition(t) {
    t.nonNull.int('minPasswordLength', {description: 'How long the password of new users is required to be'});
    t.nonNull.list.nonNull.string('allowedFileTypes', {description: 'Which types of files is the user allowed to create?'});
    t.nonNull.field('defaultSettings', {type: SettingsObjectType, description: 'The default settings that are used when not specified by the user.'});
    t.nonNull.int('automaticSaveDebounceMillis', {description: 'How many seconds should the frontend debounce before saving changes of the user automatically. This behaviour is useful for when we do not want to require the user to press a save button.'})
  }
});
