import {intArg, mutationField, nonNull, nullable, stringArg} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {noteObjectType} from "../../types/note";

export const editNoteMutation = mutationField("editNote", {
  type: noteObjectType,
  args: {
    id: nonNull(intArg()),
    title: nullable(stringArg()),
    description: nullable(stringArg()),
    startTimestamp: nullable(stringArg()),
    deadlineTimestamp: nullable(stringArg())
  },
  resolve: async (
    root,
    editedNote,
    {prisma, jwtPayload}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only edit notes when you are authenticated.');
    }
    const note = await prisma.note.findFirst({where: {id: editedNote.id}});
    if (!note) {
      throw generateNotFoundError(`There is no note with the id ${editedNote.id}.`);
    }
    if (userId !== note.creatorId) {
      throw generateAuthorizationError(`The note with the id of ${editedNote.id} does not belong to you.`);
    }
    return prisma.note.update({
      where: {id: editedNote.id},
      data: {
        updatedTimestamp: new Date(),
        description: editedNote.description,
        title: editedNote.title ?? undefined,
        startTimestamp: editedNote.startTimestamp,
        deadlineTimestamp: editedNote.deadlineTimestamp
      }
    });
  }
});
