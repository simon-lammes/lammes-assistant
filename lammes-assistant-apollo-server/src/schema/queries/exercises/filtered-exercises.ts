import {arg, nonNull, queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {ExerciseFilter} from "../../types/exercise-filter";
import {exerciseObjectType} from "../../types/exercise";

export const filteredExercises = queryField('filteredExercises', {
  type: exerciseObjectType,
  list: true,
  args: {
    exerciseFilter: nonNull(arg({type: ExerciseFilter}))
  },
  resolve: (
    root,
    {exerciseFilter: {creatorIds,labels, languageCodes}},
    {jwtPayload, prisma}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    return prisma.exercise.findMany({
      where: {
        creatorId: creatorIds && creatorIds.length > 0 ? {
          in: creatorIds
        } : undefined,
        exerciseLabels: labels && labels.length > 0 ? {
          some: {
            label: {
              title: {
                in: labels
              }
            }
          }
        } : undefined,
        languageCode: languageCodes && languageCodes.length > 0 ? {
          in: languageCodes
        } : undefined,
        // We want the displayed exercises not to contain exercises that are marked for deletion.
        markedForDeletionTimestamp: null
      },
      orderBy: {
        title: 'asc'
      }
    });
  }
});
