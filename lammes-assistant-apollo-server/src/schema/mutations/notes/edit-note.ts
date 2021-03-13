import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {NoteInput, noteObjectType} from "../../types/note";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";

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
    const userId = validateAuthenticated(jwtPayload);
    const note = await prisma.note.findFirst({
      where: {id},
      include: {noteLabels: {include: {label: true}}}
    });
    await validateMembersRole(prisma, userId, 'member', noteInput.addedGroupAccesses?.map(x => x.groupId));
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
        groupNotes: {
          create: noteInput.addedGroupAccesses?.map(({groupId, protectionLevel}) => ({
            groupId,
            protectionLevel
          })),
          update: noteInput.editedGroupAccesses?.map(({groupId, protectionLevel}) => ({
            where: {
              groupId_noteId: {
                groupId,
                noteId: id
              }
            },
            data: {
              protectionLevel
            }
          })),
          delete: noteInput.removedGroupIds?.map(groupId => ({
            groupId_noteId: {
              groupId,
              noteId: id
            }
          }))
        },
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
