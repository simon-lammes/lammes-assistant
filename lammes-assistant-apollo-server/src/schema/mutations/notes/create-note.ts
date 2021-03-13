import {arg, mutationField, nonNull} from "@nexus/schema";
import {ApolloError} from "apollo-server";
import {NoteInput, noteObjectType} from "../../types/note";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const createNote = mutationField("createNote", {
  type: noteObjectType,
  args: {
    noteInput: nonNull(arg({type: NoteInput}))
  },
  resolve: async (
    _,
    {noteInput: {title, deadlineTimestamp, description, startTimestamp, labels, addedGroupAccesses}},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    if (!title) {
      throw new ApolloError('Title required');
    }
    await validateMembersRole(prisma, userId, 'member', addedGroupAccesses?.map(x => x.groupId));
    return prisma.note.create({
      data: {
        title,
        description,
        deadlineTimestamp,
        startTimestamp,
        noteLabels: {
          create: labels?.map(label => {
            return {
              label: {
                connectOrCreate: {
                  where: {
                    title: label,
                  },
                  create: {
                    title: label
                  }
                }
              }
            };
          })
        },
        groupNotes: {
          create: addedGroupAccesses?.map(groupAccess => {
            return {
              groupId: groupAccess.groupId,
              protectionLevel: groupAccess.protectionLevel
            };
          })
        },
        creator: {
          connect: {id: userId}
        }
      }
    });
  }
});
