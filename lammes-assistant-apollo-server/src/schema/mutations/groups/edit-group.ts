import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupInputType, groupObjectType} from "../../types/group";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";

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
    const isUserMember = prisma.group.count({
      where: {
        id,
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
