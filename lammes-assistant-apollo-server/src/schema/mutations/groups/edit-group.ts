import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupInputType, groupObjectType} from "../../types/group";
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
    await validateMembersRole(prisma, userId, 'admin', [id]);
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
