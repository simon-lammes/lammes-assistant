import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {userObjectType} from "../../types/user";

export const me = queryField('me', {
  type: userObjectType,
  description: 'Returns the user object that belongs to user making the request.',
  resolve: (root, args, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    return context.prisma.user.findFirst({
      where: {
        id: userId
      }
    });
  }
});
