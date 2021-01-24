import {objectType} from "@nexus/schema";

export const registrationObjectType = objectType({
  name: 'Registration',
  definition(t) {
    t.field('jwtToken', {
      type: 'String'
    });
    t.field('user', {
      type: "User"
    });
  }
});
