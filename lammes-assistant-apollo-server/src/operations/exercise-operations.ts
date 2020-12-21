import {Context} from "../context";
import {ApolloError, AuthenticationError, UserInputError} from "apollo-server";
import {Exercise} from "@prisma/client";
import {generateUnnecessaryWhitespacesError} from "../custom-errors/unnecessary-whitespaces-error";
import {generateConflictError} from "../custom-errors/collision-error";
import { DateTime } from 'luxon';
import {ExerciseCooldown} from "./settings-operations";

interface ExerciseFragment {
  type: string;
  value: string;
}

export interface CreateExerciseInput {
  title: string;
  assignmentFragments: (ExerciseFragment | null)[];
  solutionFragments: (ExerciseFragment | null)[];
}

/**
 * An exercise with all the information belonging to it. A regular "Exercise" only contains light metadata and it saved
 * in the relational database while an "Hydrated Exercise" is a storage-intensive object saved in DigitalOcean Spaces.
 */
interface HydratedExercise {

  /**
   * Should be usable to determine whether an exercise changed without looking into the "storage-intensive" parts of the exercise.
   */
  versionTimestamp: string;
  title: string;
  assignmentFragments: ExerciseFragment[];
  solutionFragments: ExerciseFragment[];
}

/**
 * Using the exercise title, this method creates an identifying key for the exercise following a standardized procedure.
 * This key can be used to create a folder that contains all of the exercises files.
 */
function createKeyForExercise(exerciseTitle: string) {
  // Prefix 'c_' stands for custom because the exercise is tied to one user.
  return 'c_' + exerciseTitle.toLowerCase().replace(' ', '_');
}

export async function createExercise(context: Context, {
  title,
  assignmentFragments,
  solutionFragments
}: CreateExerciseInput): Promise<Exercise> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only create exercises when you are authenticated.');
  }
  if (title.length === 0) {
    throw new UserInputError('Title cannot be empty.');
  }
  if (title.includes('  ') || title.startsWith(' ') || title.endsWith(' ')) {
    throw generateUnnecessaryWhitespacesError('title');
  }
  if (assignmentFragments.some(fragment => !fragment?.type || !fragment?.value) || solutionFragments.some(fragment => !fragment?.type || !fragment?.value)) {
    throw new UserInputError('All fragments should have a not empty type and a not empty value.');
  }
  const exerciseKey = createKeyForExercise(title);
  const doesConflictingExerciseExist = await context.prisma.exercise.count({
    where: {
      key: exerciseKey
    }
  }).then(count => count > 0);
  if (doesConflictingExerciseExist) {
    throw generateConflictError('For the given exercise title, we cannot create unique key that is not yet used for another exercise.');
  }
  const versionTimestamp = new Date();
  const hydratedExercise = {
    versionTimestamp: versionTimestamp.toISOString(),
    title,
    assignmentFragments,
    solutionFragments
  } as HydratedExercise;
  const upload = context.spacesClient.putObject({
    Bucket: "lammes-assistant-space",
    Key: `exercises/${exerciseKey}.json`,
    Body: JSON.stringify(hydratedExercise),
    ContentType: "application/json",
    ACL: "private"
  });
  await upload.promise();
  return context.prisma.exercise.create({
    data: {
      title,
      key: exerciseKey,
      versionTimestamp: versionTimestamp.toISOString(),
      creator: {
        connect: {id: userId}
      },
      // For every new exercise the user creates, we directly want to create an "Experience" object containing the information
      // that the user has not yet started studying this exercise. We need this object for querying functionality.
      experiences: {
        create: {
          correctStreak: 0,
          lastStudiedTimestamp: null,
          learner: {
            connect: {id: userId}
          }
        }
      }
    }
  });
}

export async function fetchMyExercises(context: Context): Promise<Exercise[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
  }
  return context.prisma.exercise.findMany({
    where: {
      creatorId: userId,
      // We want the displayed exercises not to contain exercises that are marked for deletion.
      markedForDeletionTimestamp: null
    },
    orderBy: {
      title: 'asc'
    }
  });
}

export async function fetchMyNextExperience(context: Context, exerciseCooldown: ExerciseCooldown): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
  }
  const now = DateTime.fromJSDate(new Date());
  return context.prisma.experience.findFirst({
    where: {
      learnerId: userId,
      exercise: {
        // We want the displayed exercises not to contain exercises that are marked for deletion.
        markedForDeletionTimestamp: null
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
  });
}

export async function getExerciseDownloadLink(context: Context, exerciseKey: string): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  return context.spacesClient.getSignedUrl('getObject', {
    Bucket: "lammes-assistant-space",
    Key: `exercises/${exerciseKey}.json`,
    Expires: 60
  });
}

export async function registerExerciseExperience(context: Context, exerciseKey: string, exerciseResult: 'FAILURE' | 'SUCCESS'): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  const experience = await context.prisma.experience.findFirst({
    where: {
      learnerId: userId,
      exercise: {
        key: exerciseKey
      }
    }
  });
  if (!experience) {
    throw new ApolloError('Invalid request. For the given user and exerciseKey we could not find an experience to update.');
  }
  return context.prisma.experience.update({
    where: {
      exerciseId_learnerId: {
        exerciseId: experience.exerciseId,
        learnerId: userId
      }
    },
    data: {
      correctStreak: exerciseResult === "SUCCESS" ? {
        increment: 1
      } : 0,
      lastStudiedTimestamp: new Date()
    }
  })
}

export async function removeExercise(context: Context, exerciseId: number): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only delete exercises when you are authenticated.');
  }
  const exercise = await context.prisma.exercise.findFirst({
    where: {
      id: exerciseId
    },
    select: {
      creatorId: true
    }
  });
  if (!exercise) {
    throw new ApolloError(`Exercise with id ${exerciseId} does not exist`);
  }
  if (exercise.creatorId !== userId) {
    throw new ApolloError(`Exercise does not belong to user.`);
  }
  return context.prisma.exercise.update({
    where: {
      id: exerciseId
    },
    data: {
      markedForDeletionTimestamp: new Date()
    }
  });
}

export async function restoreExercise(context: Context, exerciseId: number): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only restore exercises when you are authenticated.');
  }
  const exercise = await context.prisma.exercise.findFirst({
    where: {
      id: exerciseId
    },
    select: {
      creatorId: true
    }
  });
  if (!exercise) {
    throw new ApolloError(`Exercise with id ${exerciseId} does not exist`);
  }
  if (exercise.creatorId !== userId) {
    throw new ApolloError(`Exercise does not belong to user.`);
  }
  return context.prisma.exercise.update({
    where: {
      id: exerciseId
    },
    data: {
      markedForDeletionTimestamp: null
    }
  });
}

export async function fetchMyExercisesThatAreMarkedForDeletion(context: Context): Promise<Exercise[]> {
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
