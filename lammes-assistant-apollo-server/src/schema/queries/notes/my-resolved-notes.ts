import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {noteObjectType} from "../../types/note";

export const myResolvedNotes = queryField('myResolvedNotes', {
  type: noteObjectType,
  list: true,
  resolve: (root, args, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can fetch your notes when you are authenticated.');
    }
    return context.prisma.note.findMany({
      where: {
        creatorId: userId,
        resolvedTimestamp: {not: null}
      },
      orderBy: [
        {
          resolvedTimestamp: 'desc'
        },
        {
          title: 'asc'
        }
      ]
    });
  }
});
