import {intArg, mutationField, nonNull} from "@nexus/schema";
import {ApolloError, AuthenticationError} from "apollo-server";
import {exerciseObjectType} from "../../types/exercise";

export const restoreExercise = mutationField("restoreExercise", {
  type: exerciseObjectType,
  args: {
    id: nonNull(intArg()),
  },
  resolve: async (root, {id}, {jwtPayload, prisma}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only restore exercises when you are authenticated.');
    }
    const exercise = await prisma.exercise.findFirst({
      where: {
        id
      },
      select: {
        creatorId: true
      }
    });
    if (!exercise) {
      throw new ApolloError(`Exercise with id ${id} does not exist`);
    }
    if (exercise.creatorId !== userId) {
      throw new ApolloError(`Exercise does not belong to user.`);
    }
    return prisma.exercise.update({
      where: {
        id
      },
      data: {
        markedForDeletionTimestamp: null
      }
    });
  }
});
