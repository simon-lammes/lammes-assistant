import {PrismaClient} from "@prisma/client";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";

/**
 * Makes sure a user is a member of a group.
 */
export function validateMembership(prisma: PrismaClient, groupId: number, userId: number) {
  const isUserMember = prisma.group.count({
    where: {
      id: groupId,
      groupMemberships: {
        some: {
          memberId: userId
        }
      }
    }
  }).then(count => count > 0);
  if (!isUserMember) {
    throw generateNotFoundError('Either the group does not exist or you are not a member of that group.');
  }
}
