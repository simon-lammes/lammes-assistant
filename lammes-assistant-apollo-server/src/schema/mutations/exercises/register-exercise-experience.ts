import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {ExerciseResult} from "../../types/exercise-result";
import {AuthenticationError} from "apollo-server";
import {experienceObjectType} from "../../types/experience";

export const registerExerciseExperience = mutationField("registerExerciseExperience", {
  type: experienceObjectType,
  args: {
    exerciseId: nonNull(intArg()),
    exerciseResult: nonNull(arg({type: ExerciseResult}))
  },
  resolve: (root, {exerciseId, exerciseResult}, {prisma, jwtPayload}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    return prisma.experience.upsert({
      where: {
        exerciseId_learnerId: {
          exerciseId: exerciseId,
          learnerId: userId
        }
      },
      update: {
        correctStreak: exerciseResult === "SUCCESS" ? {
          increment: 1
        } : 0,
        lastStudiedTimestamp: new Date()
      },
      create: {
        exercise: {
          connect: {
            id: exerciseId
          }
        },
        learner: {
          connect: {
            id: userId
          }
        },
        correctStreak: 0,
        lastStudiedTimestamp: new Date()
      }
    });
  }
});
