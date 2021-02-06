import {inputObjectType, objectType} from "@nexus/schema";

export const groupObjectType = objectType({
  name: 'GroupMembership',
  definition(t) {
    t.model.memberId();
    t.model.groupId();
    t.model.user();
  }
});

export const NewGroupMembership = inputObjectType({
  name: 'NewGroupMembership',
  definition(t) {
    t.nonNull.int('memberId');
  }
});
