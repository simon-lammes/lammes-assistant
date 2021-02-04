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
    const note = await prisma.note.findFirst({
      where: {id},
      include: {noteLabels: {include: {label: true}}}
    });
    if (!note) {
      throw generateNotFoundError(`There is no note with the id ${id}.`);
    }
    if (userId !== note.creatorId) {
      throw generateAuthorizationError(`The note with the id of ${id} does not belong to you.`);
    }
    // Which labels are currently associated with the exercise?
    const currentLabels = note.noteLabels.map(noteLabel => noteLabel.label);
    // Which labels has the user removed or added to the exercise?
    const removeLabels = currentLabels.filter(label => !noteInput.labels?.some(x => x === label.title));
    const addedLabels = noteInput.labels?.filter(label => !currentLabels.some(x => x.title === label));
    return prisma.note.update({
      where: {id},
      data: {
        updatedTimestamp: new Date(),
        description: noteInput.description,
        title: noteInput.title ?? undefined,
        startTimestamp: noteInput.startTimestamp,
        deadlineTimestamp: noteInput.deadlineTimestamp,
        noteLabels: {
          deleteMany: removeLabels.length > 0 ? removeLabels.map(label => {
            return {
              noteId: id,
              labelId: label.id
            };
          }) : undefined,
          create: addedLabels?.map(label => {
            return {
              label: {
                connectOrCreate: {
                  create: {
                    title: label
                  },
                  where: {
                    title: label
                  }
                }
              }
            };
          })
        }
      }
    });
  }
});
