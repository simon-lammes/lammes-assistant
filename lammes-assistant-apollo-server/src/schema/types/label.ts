import {objectType} from "@nexus/schema";

export const labelObjectType = objectType({
  name: 'Label',
  definition(t) {
    t.model.id();
    t.model.title();
  }
});
