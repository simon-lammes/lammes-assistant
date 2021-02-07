import {AuthenticationError} from "apollo-server";
import {arg, nonNull, nullable, queryField} from "@nexus/schema";
import {userObjectType} from "../../types/user";
import {UserFilterDefinition} from "../../types/user-filter";

export const filteredUsers = queryField('filteredUsers', {
  type: userObjectType,
  list: true,
  args: {
    userFilter: nonNull(arg({type: UserFilterDefinition}))
  },
  resolve: (
    root,
    {userFilter: {query, userIds}},
    {jwtPayload, prisma}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    return prisma.user.findMany({
      where: {
        username: query ? {
          contains: query,
          mode: 'insensitive'
        } : undefined,
        id: userIds && userIds.length > 0 ? {
          in: userIds
        } : undefined
      },
      orderBy: {
        username: 'asc'
      }
    });
  }
});
