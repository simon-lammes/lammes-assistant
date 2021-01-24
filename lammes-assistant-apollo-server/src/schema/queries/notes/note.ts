import {intArg, nonNull, queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";

export const note = queryField('note', {
  type: 'Note',
  args: {
    id: nonNull(intArg())
  },
  resolve: async (root, {id}, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch notes when you are authenticated.');
    }
    const note = await context.prisma.note.findFirst({where: {id}});
    if (!note) {
      throw generateNotFoundError(`There is no note with the id ${id}.`);
    }
    if (userId !== note.creatorId) {
      throw generateAuthorizationError(`The note with the id of ${id} does not belong to you.`);
    }
    return note;
  }
});
