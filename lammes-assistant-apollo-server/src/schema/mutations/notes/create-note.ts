import {mutationField, nonNull, nullable, stringArg} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {noteObjectType} from "../../types/note";

export const createNote = mutationField("createNote", {
  type: noteObjectType,
  args: {
    title: nonNull(stringArg()),
    description: nullable(stringArg())
  },
  resolve: async (_, {title, description}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only create notes when you are authenticated.');
    }
    return prisma.note.create({
      data: {
        title,
        description,
        creator: {
          connect: {id: userId}
        }
      }
    });
  }
});
