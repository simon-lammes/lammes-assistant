import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {noteObjectType} from "../../types/note";

export const myPendingNotes = queryField('myPendingNotes', {
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
        resolvedTimestamp: null,
        // We only want those notes whose startTimestamp is in the past. This is a criterion we have set for **pending** notes.
        startTimestamp: {lte: new Date()}
      },
      orderBy: [
        {
          deadlineTimestamp: 'asc'
        },
        {
          title: 'asc'
        }
      ]
    });
  }
});
