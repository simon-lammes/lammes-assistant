import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {exerciseObjectType} from "../../types/exercise";

export const myExercisesThatAreMarkedForDeletion = queryField('myExercisesThatAreMarkedForDeletion', {
  type: exerciseObjectType,
  list: true,
  resolve: (root, args, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    return context.prisma.exercise.findMany({
      where: {
        creatorId: userId,
        markedForDeletionTimestamp: {
          not: null
        }
      },
      orderBy: {
        markedForDeletionTimestamp: 'desc'
      }
    });
  }
});
