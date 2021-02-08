import {queryField} from "@nexus/schema";
import {noteObjectType} from "../../types/note";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const myNoteToReview = queryField('myNoteToReview', {
  type: noteObjectType,
  nullable: true,
  resolve: (root, args, {jwtPayload, prisma}) => {
    const userId = validateAuthenticated(jwtPayload);
    const now = new Date();
    return prisma.note.findFirst({
      where: {
        creatorId: userId,
        // The user only needs to review notes that aren't resolved yet.
        resolvedTimestamp: null,
        // The user does not need to review notes that he/she deferred.
        startTimestamp: {
          lte: now
        }
      },
      orderBy: {
        deadlineTimestamp: 'asc'
      }
    });
  }
});
