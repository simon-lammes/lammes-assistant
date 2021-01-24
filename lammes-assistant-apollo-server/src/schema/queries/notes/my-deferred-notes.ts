import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {noteObjectType} from "../../types/note";

export const myDeferredNotes = queryField('myDeferredNotes', {
  type: noteObjectType,
  list: true,
  resolve: (root, args, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your notes when you are authenticated.');
    }
    return context.prisma.note.findMany({
      where: {
        creatorId: userId,
        resolvedTimestamp: null,
        // Deferred notes are notes whose startTime is in the future or not even specified.
        OR: [
          {
            startTimestamp: {gt: new Date()}
          },
          {
            startTimestamp: null
          }
        ]
      },
      orderBy: [
        {
          startTimestamp: 'asc'
        },
        {
          title: 'asc'
        }
      ],
    });
  }
});
