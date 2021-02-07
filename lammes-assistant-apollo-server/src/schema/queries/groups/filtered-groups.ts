import {arg, nonNull, queryField} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {GroupFilterDefinition} from "../../types/group-filter-definition";

export const filteredGroups = queryField('filteredGroups', {
  type: groupObjectType,
  list: true,
  args: {
    groupFilter: nonNull(arg({type: GroupFilterDefinition}))
  },
  resolve: (
    root,
    {groupFilter: {groupIds}},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.group.findMany({
      where: {
        id: groupIds && groupIds.length > 0 ? {
          in: groupIds
        } : undefined
      },
    });
  }
});
