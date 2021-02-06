import {arg, intArg, list, mutationField, nonNull} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembership} from "../../../utils/validators/group-validation/validate-membership";
import {UserInputError} from "apollo-server";
import {NewGroupMembership} from "../../types";
import {me} from "../../queries";

export const addGroupMemberships = mutationField('addGroupMemberships', {
  type: groupObjectType,
  args: {
    id: nonNull(intArg()),
    addedMemberships: nonNull(list(nonNull(arg({type: NewGroupMembership}))))
  },
  resolve: async (
    root,
    {id, addedMemberships},
    {jwtPayload, prisma}
  ) => {
    if (!addedMemberships || addedMemberships.length === 0) {
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
          create: addedMemberships.map(membership => {
            return {
              memberId: membership.memberId
            }
          })
        }
      }
    })
  }
});
