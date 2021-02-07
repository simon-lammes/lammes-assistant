import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupInputType, groupObjectType} from "../../types/group";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";

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
    validateMembersRole(prisma, id, userId, 'admin');
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
