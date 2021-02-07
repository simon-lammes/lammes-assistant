import {enumType} from "@nexus/schema";

export type GroupMemberRole = 'owner' | 'admin' | 'member';

export const GroupMemberRoleEnumType = enumType({
  name: 'GroupMemberRole',
  members: ['owner', 'admin', 'member']
});
