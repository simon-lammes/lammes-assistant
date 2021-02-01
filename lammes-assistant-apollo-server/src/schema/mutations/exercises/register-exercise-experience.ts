import {arg, intArg, mutationField, nonNull, nullable} from "@nexus/schema";
import {ExerciseResult} from "../../types/exercise-result";
import {AuthenticationError} from "apollo-server";
import {experienceObjectType} from "../../types/experience";
import {PrismaClient} from "@prisma/client";

export const registerExerciseExperience = mutationField("registerExerciseExperience", {
  type: experienceObjectType,
  args: {
    exerciseId: nonNull(intArg()),
    exerciseResult: nonNull(arg({type: ExerciseResult})),
    exerciseCorrectStreakCap: nullable(intArg())
  },
  resolve: async (root, {exerciseId, exerciseResult, exerciseCorrectStreakCap}, {prisma, jwtPayload}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    const newCorrectStreak = await determineNewCorrectStreak(prisma, exerciseId, userId, exerciseResult, exerciseCorrectStreakCap);
    return prisma.experience.upsert({
      where: {
        exerciseId_learnerId: {
          exerciseId: exerciseId,
          learnerId: userId
        }
      },
      update: {
        correctStreak: newCorrectStreak,
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

async function determineNewCorrectStreak(prisma: PrismaClient, exerciseId: number, userId: number, exerciseResult: "FAILURE" | "SUCCESS", exerciseCorrectStreakCap: number | null | undefined) {
  const experience = await prisma.experience.findFirst({
    where: {
      exerciseId: exerciseId,
      learnerId: userId
    }
  });
  let newCorrectStreak = experience?.correctStreak ?? 0;
  if (exerciseResult === 'FAILURE') {
    newCorrectStreak = 0;
  } else if (exerciseResult === 'SUCCESS') {
    newCorrectStreak++;
  }
  if (exerciseCorrectStreakCap && newCorrectStreak > exerciseCorrectStreakCap) {
    newCorrectStreak = exerciseCorrectStreakCap;
  }
  return newCorrectStreak;
}
