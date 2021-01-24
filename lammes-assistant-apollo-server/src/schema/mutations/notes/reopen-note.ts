import {intArg, mutationField, nonNull} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {noteObjectType} from "../../types/note";

export const reopenNote = mutationField("reopenNote", {
  type: noteObjectType,
  args: {
    noteId: nonNull(intArg())
  },
  resolve: async (root, {noteId}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only reopen notes when you are authenticated.');
    }
    const note = await prisma.note.findFirst({
      where: {
        id: noteId
      }
    });
    if (!note) {
      throw generateNotFoundError(`No note with id ${noteId}.`);
    }
    if (note.creatorId !== userId) {
      throw generateAuthorizationError("You cannot resolve notes of other users.");
    }
    return prisma.note.update({
      where: {id: noteId},
      data: {
        resolvedTimestamp: null
      }
    });
  }
});
