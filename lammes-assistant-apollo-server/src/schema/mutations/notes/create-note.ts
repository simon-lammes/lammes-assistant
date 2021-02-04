import {arg, mutationField, nonNull} from "@nexus/schema";
import {ApolloError, AuthenticationError} from "apollo-server";
import {NoteInput, noteObjectType} from "../../types/note";

export const createNote = mutationField("createNote", {
  type: noteObjectType,
  args: {
    noteInput: nonNull(arg({type: NoteInput}))
  },
  resolve: async (
    _,
    {noteInput: {title, deadlineTimestamp, description, startTimestamp, labels}},
    {jwtPayload, prisma}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only create notes when you are authenticated.');
    }
    if (!title) {
      throw new ApolloError('Title required');
    }
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
        creator: {
          connect: {id: userId}
        }
      }
    });
  }
});
