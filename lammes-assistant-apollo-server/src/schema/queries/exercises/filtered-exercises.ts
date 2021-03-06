import {arg, nonNull, queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {ExerciseFilterDefinition} from "../../types/exercise-filter-definition";
import {exerciseObjectType} from "../../types/exercise";

export const filteredExercises = queryField('filteredExercises', {
  type: exerciseObjectType,
  list: true,
  args: {
    exerciseFilter: nonNull(arg({type: ExerciseFilterDefinition}))
  },
  resolve: (
    root,
    {exerciseFilter: {creatorIds, labels, languageCodes, maximumCorrectStreak, exerciseTypes, groupIds}},
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
        groupExercises: groupIds && groupIds.length > 0 ? {
          some: {
            groupId: {
              in: groupIds
            }
          }
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
        exerciseType: exerciseTypes && exerciseTypes.length > 0 ? {
          in: exerciseTypes
        } : undefined,
        // Match exercises whose experience either fit the 'maximumCorrectStreak' filter or does not yet exist for the user.
        OR: [
          {
            experiences: {
              some: {
                learnerId: userId,
                correctStreak: typeof maximumCorrectStreak === 'number' ? {
                  lte: maximumCorrectStreak
                } : undefined,
              }
            }
          },
          {
            experiences: {
              none: {
                learnerId: userId
              }
            }
          }
        ],
        // We want the displayed exercises not to contain exercises that are marked for deletion.
        markedForDeletionTimestamp: null
      },
      orderBy: {
        title: 'asc'
      }
    });
  }
});
