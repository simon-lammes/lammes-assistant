import {inputObjectType, objectType} from "@nexus/schema";

export const groupMembershipObjectType = objectType({
  name: 'GroupMembership',
  definition(t) {
    t.model.memberId();
    t.model.groupId();
    t.model.user();
    t.model.role();
  }
});

export const NewGroupMembership = inputObjectType({
  name: 'NewGroupMembership',
  definition(t) {
    t.nonNull.int('memberId');
  }
});
