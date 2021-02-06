import {intArg, list, mutationField, nonNull} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {UserInputError} from "apollo-server";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembership} from "../../../utils/validators/group-validation/validate-membership";

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
    validateMembership(prisma, id, userId);
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
