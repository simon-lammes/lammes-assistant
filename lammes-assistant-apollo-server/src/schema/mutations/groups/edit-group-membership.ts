import {arg, intArg, list, mutationField, nonNull} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {groupMembershipObjectType, NewGroupMembership} from "../../types";
import {ForbiddenError, UserInputError} from "apollo-server";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";
import {GroupMemberRole, GroupMemberRoleEnumType} from "../../types/group-member-role";

export const editGroupMembership = mutationField('editGroupMembership', {
  type: groupMembershipObjectType,
  args: {
    groupId: nonNull(intArg()),
    memberId: nonNull(intArg()),
    role: nonNull(arg({type: GroupMemberRoleEnumType}))
  },
  resolve: async (
    root,
    {groupId, memberId, role},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    if (userId === memberId) {
      throw new ForbiddenError('You cannot edit your own role');
    }
    const oldRole: GroupMemberRole | undefined = await prisma.groupMembership.findUnique({
      where: {
        memberId_groupId: {
          groupId,
          memberId
        }
      },
      select: {
        role: true
      }
    }).then(result => result?.role);
    if (oldRole === 'owner') {
      throw new ForbiddenError('The role of other owners cannot be changed.');
    }
    let minRole: GroupMemberRole = 'owner';
    if (role !== 'owner' && oldRole !== 'admin') {
      minRole = 'admin';
    }
    await validateMembersRole(prisma, groupId, userId, minRole);
    return prisma.groupMembership.update({
      where: {
        memberId_groupId: {
          groupId,
          memberId
        }
      },
      data: {
        role
      }
    })
  }
});
