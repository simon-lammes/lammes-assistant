import {Context} from "../context";
import {ApolloError, AuthenticationError, UserInputError} from "apollo-server";
import {Exercise, ExerciseLabelScalarWhereInput} from "@prisma/client";
import {generateUnnecessaryWhitespacesError} from "../custom-errors/unnecessary-whitespaces-error";
import {DateTime} from 'luxon';
import {ExerciseCooldown} from "./settings-operations";
import {generateAuthorizationError} from "../custom-errors/authorization-error";
import {generateNotFoundError} from "../custom-errors/not-found-error";

export interface CustomFile {
  name: string;
  value: string;
}

export interface PossibleAnswer {
  value: string;
  correct: boolean;
}

export type ExerciseType = 'standard' | 'multiselect' | 'trueOrFalse';

export interface CreateExerciseInput {
  title: string;
  assignment: string;
  solution: string;
  exerciseType: ExerciseType;
  files: CustomFile[];
  labels: string[];
  isStatementCorrect?: boolean | null;
  possibleAnswers?: PossibleAnswer[] | null;
}

export interface UpdateExerciseInput {
  id: number;
  title: string;
  assignment: string;
  solution: string;
  exerciseType: ExerciseType;
  files: CustomFile[];
  labels: string[];
  isStatementCorrect?: boolean | null;
  possibleAnswers?: PossibleAnswer[] | null;
}

/**
 * An exercise with all the information belonging to it. A regular "Exercise" only contains light metadata and it saved
 * in the relational database while an "Hydrated Exercise" is a storage-intensive object saved in DigitalOcean Spaces.
 */
interface HydratedExercise {
  id: number;
  /**
   * Should be usable to determine whether an exercise changed without looking into the "storage-intensive" parts of the exercise.
   */
  versionTimestamp: string;
  title: string;
  assignment: string;
  solution: string;
  files: CustomFile[];
  labels: string[];
  exerciseType: 'standard' | 'trueOrFalse';
  isStatementCorrect?: boolean;
  possibleAnswers?: PossibleAnswer[];
}

/**
 * The user might want to filter for specific exercises.
 */
export interface ExerciseFilter {
  labels: string[];
  creatorIds?: number[] | null;
}

export async function createExercise(context: Context, {
  title,
  assignment,
  solution,
  exerciseType,
  isStatementCorrect,
  files,
  labels,
  possibleAnswers
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
  const versionTimestamp = new Date();
  const exercise: Exercise = await context.prisma.exercise.create({
    data: {
      title,
      versionTimestamp: versionTimestamp.toISOString(),
      creator: {
        connect: {id: userId}
      },
      exerciseLabels: {
        create: labels.map(label => {
          return {
            label: {
              connectOrCreate: {
                create: {
                  title: label
                },
                where: {
                  title: label
                }
              }
            }
          };
        })
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
  const hydratedExercise = {
    id: exercise.id,
    versionTimestamp: versionTimestamp.toISOString(),
    title,
    assignment,
    solution,
    exerciseType,
    isStatementCorrect,
    files,
    labels,
    possibleAnswers
  } as HydratedExercise;
  const upload = context.spacesClient.putObject({
    Bucket: "lammes-assistant-space",
    Key: `exercises/exercise-${exercise.id}.json`,
    Body: JSON.stringify(hydratedExercise),
    ContentType: "application/json",
    ACL: "private"
  });
  await upload.promise();
  return exercise;
}

export async function updateExercise(context: Context, {
  id,
  title,
  assignment,
  solution,
  exerciseType,
  isStatementCorrect,
  files,
  labels,
  possibleAnswers
}: UpdateExerciseInput): Promise<Exercise> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You need to be authenticated.');
  }
  const exercise = await context.prisma.exercise.findFirst({where: {id}});
  if (!exercise) {
    throw generateNotFoundError(`No exercise with id ${exercise}.`);
  }
  if (exercise.creatorId !== userId) {
    throw generateAuthorizationError("You do not own the requested resource.");
  }
  const versionTimestamp = new Date();
  const hydratedExercise = {
    id,
    versionTimestamp: versionTimestamp.toISOString(),
    title,
    assignment,
    solution,
    exerciseType,
    isStatementCorrect,
    files,
    labels,
    possibleAnswers
  } as HydratedExercise;
  const upload = context.spacesClient.putObject({
    Bucket: "lammes-assistant-space",
    Key: `exercises/exercise-${exercise.id}.json`,
    Body: JSON.stringify(hydratedExercise),
    ContentType: "application/json",
    ACL: "private"
  });
  // Which labels are currently associated with the exercise?
  const currentLabelsPromise = context.prisma.label.findMany({
    where: {
      exerciseLabels: {
        some: {
          exerciseId: id
        }
      }
    }
  })
  const [currentLabels] = await Promise.all([currentLabelsPromise, upload.promise()]);
  // Which labels has the user removed or added to the exercise?
  const removeLabels = currentLabels.filter(label => !labels.some(x => x === label.title));
  const addedLabels = labels.filter(label => !currentLabels.some(x => x.title === label));
  return context.prisma.exercise.update({
    where: {
      id
    },
    data: {
      title,
      exerciseLabels: {
        deleteMany: removeLabels.length > 0 ? removeLabels.map(label => {
          return {
            exerciseId: id,
            labelId: label.id
          } as ExerciseLabelScalarWhereInput;
        }) : undefined,
        create: addedLabels.map(label => {
          return {
            label: {
              connectOrCreate: {
                create: {
                  title: label
                },
                where: {
                  title: label
                }
              }
            }
          };
        })
      },
      versionTimestamp: versionTimestamp.toISOString(),
    }
  });
}

export async function fetchFilteredExercises(context: Context, {
  creatorIds,
  labels
}: ExerciseFilter): Promise<Exercise[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
  }
  return context.prisma.exercise.findMany({
    where: {
      creatorId: creatorIds && creatorIds.length > 0 ? {
        in: creatorIds
      } : userId,
      exerciseLabels: labels?.length > 0 ? {
        some: {
          label: {
            title: {
              in: labels
            }
          }
        }
      } : undefined,
      // We want the displayed exercises not to contain exercises that are marked for deletion.
      markedForDeletionTimestamp: null
    },
    orderBy: {
      title: 'asc'
    }
  });
}

export async function fetchMyNextExercise({prisma, jwtPayload}: Context, exerciseCooldown: ExerciseCooldown, creatorIds?: number[] | null, labels?: string[] | null): Promise<any> {
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
      } : userId,
      exerciseLabels: labels && labels.length > 0 ? {
        some: {
          label: {
            title: {
              in: labels
            }
          }
        }
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
    include: {
      exercise: true
    }
  });
  return mostUnstableExperience?.exercise;
}

export async function getExerciseDownloadLink(context: Context, exerciseId: number): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  return context.spacesClient.getSignedUrl('getObject', {
    Bucket: "lammes-assistant-space",
    Key: `exercises/exercise-${exerciseId}.json`,
    Expires: 60
  });
}

export async function registerExerciseExperience(context: Context, exerciseId: number, exerciseResult: 'FAILURE' | 'SUCCESS'): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  return context.prisma.experience.upsert({
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
