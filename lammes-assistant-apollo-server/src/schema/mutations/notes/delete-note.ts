import {intArg, mutationField, nonNull} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {noteObjectType} from "../../types/note";

export const deleteNote = mutationField("deleteNote", {
  type: noteObjectType,
  args: {
    noteId: nonNull(intArg())
  },
  resolve: async (root, {noteId}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only delete notes when you are authenticated.');
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
      throw generateAuthorizationError("You cannot delete notes of other users.");
    }
    return await prisma.note.delete({where: {id: noteId}});
  }
});
