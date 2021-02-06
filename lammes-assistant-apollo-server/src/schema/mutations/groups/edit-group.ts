import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupInputType, groupObjectType} from "../../types/group";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {validateMembership} from "../../../utils/validators/group-validation/validate-membership";

export const editGroup = mutationField('editGroup', {
  type: groupObjectType,
  args: {
    id: nonNull(intArg()),
    group: nonNull(arg({type: groupInputType}))
  },
  resolve: async (
    root,
    {id, group},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    validateMembership(prisma, id, userId);
    return prisma.group.update({
      where: {
        id
      },
      data: {
        name: group.name,
        description: group.description
      }
    })
  }
});
