import {nullable, queryField, stringArg} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {labelObjectType} from "../../types/label";

export const filteredLabels = queryField('filteredLabels', {
  type: labelObjectType,
  list: true,
  args: {
    query: nullable(stringArg()),
  },
  resolve: (root, {query}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    return prisma.label.findMany({
      where: {
        title: query ? {
          contains: query,
          mode: 'insensitive'
        } : undefined
      },
      orderBy: {
        title: 'asc'
      }
    });
  }
});
