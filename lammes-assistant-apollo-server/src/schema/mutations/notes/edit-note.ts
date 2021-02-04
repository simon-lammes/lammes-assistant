import {arg, intArg, mutationField, nonNull, nullable, stringArg} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {NoteInput, noteObjectType} from "../../types/note";

export const editNoteMutation = mutationField("editNote", {
  type: noteObjectType,
  args: {
    id: nonNull(intArg()),
    noteInput: nonNull(arg({type: NoteInput}))
  },
  resolve: async (
    root,
    {id, noteInput},
    {prisma, jwtPayload}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only edit notes when you are authenticated.');
    }
    const note = await prisma.note.findFirst({where: {id}});
    if (!note) {
      throw generateNotFoundError(`There is no note with the id ${id}.`);
    }
    if (userId !== note.creatorId) {
      throw generateAuthorizationError(`The note with the id of ${id} does not belong to you.`);
    }
    return prisma.note.update({
      where: {id},
      data: {
        updatedTimestamp: new Date(),
        description: noteInput.description,
        title: noteInput.title ?? undefined,
        startTimestamp: noteInput.startTimestamp,
        deadlineTimestamp: noteInput.deadlineTimestamp
      }
    });
  }
});
