import {AuthenticationError} from "apollo-server";
import {nullable, queryField, stringArg} from "@nexus/schema";
import {userObjectType} from "../../types/user";

export const filteredUsers = queryField('filteredUsers', {
  type: userObjectType,
  list: true,
  args: {
    query: nullable(stringArg()),
  },
  resolve: (root, {query}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    return prisma.user.findMany({
      where: {
        username: query ? {
          contains: query,
          mode: 'insensitive'
        } : undefined
      },
      orderBy: {
        username: 'asc'
      }
    });
  }
});
