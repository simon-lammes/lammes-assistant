import {objectType} from "@nexus/schema";

export const userObjectType = objectType({
  name: 'User',
  definition(t) {
    t.model.id();
    t.model.firstName();
    t.model.lastName();
    t.model.username();
    t.model.notes();
    t.model.settingsUpdatedTimestamp();
  },
});
