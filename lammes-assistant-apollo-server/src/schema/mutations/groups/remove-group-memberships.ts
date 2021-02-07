import {intArg, list, mutationField, nonNull} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {ForbiddenError, UserInputError} from "apollo-server";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";
import {GroupMemberRole} from "../../types/group-member-role";

export const removeGroupMemberships = mutationField('removeGroupMemberships', {
  type: groupObjectType,
  args: {
    id: nonNull(intArg()),
    removedMemberIds: nonNull(list(nonNull(intArg())))
  },
  resolve: async (
    root,
    {id, removedMemberIds},
    {jwtPayload, prisma}
  ) => {
    if (!removedMemberIds || removedMemberIds.length === 0) {
      throw new UserInputError('Array length should be larger than 0');
    }
    const userId = validateAuthenticated(jwtPayload);
    const rolesOfRemovedMembers = await prisma.groupMembership.findMany({
      where: {
        groupId: id,
        memberId: {
          in: removedMemberIds
        }
      },
      select: {
        role: true
      },
      distinct: 'role'
    }).then(result => result.map(x => x.role));
    // If the user only removes himself, the operation is automatically permitted.
    // Otherwise, we have to authorize it.
    if (!(removedMemberIds.length === 1 && removedMemberIds[0] === userId)) {
      if (rolesOfRemovedMembers.includes('owner')) {
        throw new ForbiddenError('Owners cannot be removed. They can only leave the group by themself.');
      }
      let minRole: GroupMemberRole = 'owner';
      if (!rolesOfRemovedMembers.includes('owner') && !rolesOfRemovedMembers.includes('admin')) {
        minRole = 'admin';
      }
      await validateMembersRole(prisma, userId, minRole, [id]);
    }
    return prisma.group.update({
      where: {
        id
      },
      data: {
        groupMemberships: {
          delete: removedMemberIds.map(memberId => {
            return {
              memberId_groupId: {
                memberId,
                groupId: id
              }
            };
          }),
        }
      }
    })
  }
});
