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
