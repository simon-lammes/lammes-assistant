import {arg, nonNull, queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {DateTime} from "luxon";
import {ExerciseCooldownInputType} from "../../types/exercise-cooldown";
import {ExerciseFilterDefinition} from "../../types/exercise-filter-definition";
import {exerciseObjectType} from "../../types/exercise";

export const myNextExercise = queryField('myNextExercise', {
  type: exerciseObjectType,
  nullable: true,
  args: {
    exerciseCooldown: nonNull(arg({type: ExerciseCooldownInputType})),
    exerciseFilter: nonNull(arg({type: ExerciseFilterDefinition}))
  },
  resolve: async (
    root,
    {
      exerciseCooldown,
      exerciseFilter: {creatorIds, labels, languageCodes, maximumCorrectStreak, exerciseTypes, groupIds}
    },
    {jwtPayload, prisma}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
    }
    const now = DateTime.fromJSDate(new Date());
    // We first try to find an exercise that fits the criteria and that the user has never done.
    const exerciseWithNoExperience = await prisma.exercise.findFirst({
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
        markedForDeletionTimestamp: null,
        experiences: {
          none: {
            learnerId: userId
          }
        },
      },
    });
    if (exerciseWithNoExperience) {
      return exerciseWithNoExperience;
    }
    // Now we look for an exercise in which the user has the smallest correct streak.
    const mostUnstableExperience = await prisma.experience.findFirst({
      where: {
        learnerId: userId,
        correctStreak: typeof maximumCorrectStreak === 'number' ? {
          lte: maximumCorrectStreak
        } : undefined,
        // Suspended means that the user does not want to study the exercise anymore.
        suspendedTimestamp: null,
        exercise: {
          // We want the displayed exercises not to contain exercises that are marked for deletion.
          markedForDeletionTimestamp: null,
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
          } : undefined
        },
        OR: [
          {
            lastStudiedTimestamp: {
              lte: now.minus({
                days: exerciseCooldown.days,
                hours: exerciseCooldown.hours,
                minutes: exerciseCooldown.minutes
              }).toISO()
            }
          },
          {
            lastStudiedTimestamp: null
          }
        ]
      },
      orderBy: {
        correctStreak: 'asc'
      },
      include: {
        exercise: true
      }
    });
    return mostUnstableExperience?.exercise ?? null;
  }
});
