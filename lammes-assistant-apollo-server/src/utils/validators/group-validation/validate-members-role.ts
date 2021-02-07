import {PrismaClient} from "@prisma/client";
import { ForbiddenError } from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {GroupMemberRole} from "../../../schema/types/group-member-role";

const rolesInOrder: GroupMemberRole[] = ['owner', 'admin', 'member'];

/**
 * Makes sure a user is a member of a group and at least has a specific role.
 */
export async function validateMembersRole(prisma: PrismaClient, groupId: number, userId: number, minRole: GroupMemberRole) {
  const allowedRoles: GroupMemberRole[] = [];
  for (const role of rolesInOrder) {
    allowedRoles.push(role);
    if (role === minRole) {
      break;
    }
  }
  const isAllowed = await prisma.groupMembership.count({
    where: {
      groupId,
      memberId: userId,
      role: {
        in: allowedRoles
      }
    }
  }).then(count => count > 0);
  if (!isAllowed) {
    throw new ForbiddenError('Either the group does not exist or you do not have the required role / permissions.');
  }
}
