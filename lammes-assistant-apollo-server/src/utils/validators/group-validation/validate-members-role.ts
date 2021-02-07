import {PrismaClient} from "@prisma/client";
import {ForbiddenError} from "apollo-server";
import {GroupMemberRole} from "../../../schema/types/group-member-role";

const rolesInOrder: GroupMemberRole[] = ['owner', 'admin', 'member'];

/**
 * Makes sure a user is a member of a group and at least has a specific role.
 * @param prisma
 * @param userId the id of the user that we want to authorize
 * @param minRole the minimum required role that the user should have
 * @param groupIds? the ids of all groups in which the user should have a specific role.
 */
export async function validateMembersRole(prisma: PrismaClient, userId: number, minRole: GroupMemberRole, groupIds?: number[] | null): Promise<void> {
  if (!groupIds || groupIds.length === 0) {
    return;
  }
  const allowedRoles: GroupMemberRole[] = [];
  for (const role of rolesInOrder) {
    allowedRoles.push(role);
    if (role === minRole) {
      break;
    }
  }
  const isAllowed = await prisma.groupMembership.count({
    where: {
      groupId: {
        in: groupIds
      },
      memberId: userId,
      role: {
        in: allowedRoles
      }
    }
  }).then(count => count === groupIds.length);
  if (!isAllowed) {
    throw new ForbiddenError('Either the specified groups do not exist or you do not have the required role / permissions.');
  }
}
