import {arg, mutationField, nonNull} from "@nexus/schema";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupInputType, groupObjectType} from "../../types/group";

export const createGroup = mutationField('createGroup', {
  type: groupObjectType,
  args: {
    group: nonNull(arg({type: groupInputType}))
  },
  resolve: async (
    root,
    {group},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.group.create({
      data: {
        name: group.name,
        description: group.description,
        groupMemberships: {
          create: {memberId: userId}
        }
      }
    })
  }
});
