import {arg, booleanArg, intArg, list, mutationField, nonNull, nullable, stringArg} from "@nexus/schema";
import {ExerciseType} from "../../types/exercise-type";
import {LanguageCodeEnumType} from "../../types/language-code";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {ExerciseLabelScalarWhereInput} from "@prisma/client";
import {CustomFile} from "../../types/custom-file";
import {PossibleAnswer} from "../../types/possible-answer";
import {HydratedExercise} from "../../types/hydrated-exercise";
import {exerciseObjectType} from "../../types/exercise";

export const updateExercise = mutationField("updateExercise", {
  type: exerciseObjectType,
  args: {
    id: nonNull(intArg()),
    title: nonNull(stringArg()),
    assignment: nonNull(stringArg()),
    solution: nonNull(stringArg()),
    exerciseType: nonNull(arg({type: ExerciseType})),
    files: nonNull(list(arg({type: CustomFile}))),
    labels: nonNull(list(nonNull(stringArg()))),
    isStatementCorrect: nullable(booleanArg()),
    possibleAnswers: nullable(list(arg({type: PossibleAnswer}))),
    languageCode: nonNull(arg({type: LanguageCodeEnumType}))
  },
  resolve: async (
    root,
    {
      title,
      assignment,
      exerciseType,
      files,
      id,
      isStatementCorrect,
      labels,
      languageCode,
      possibleAnswers,
      solution
    },
    {jwtPayload, prisma, spacesClient}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You need to be authenticated.');
    }
    const exercise = await prisma.exercise.findFirst({where: {id}});
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
      possibleAnswers,
      languageCode
    } as HydratedExercise;
    const upload = spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: `exercises/exercise-${exercise.id}.json`,
      Body: JSON.stringify(hydratedExercise),
      ContentType: "application/json",
      ACL: "private"
    });
    // Which labels are currently associated with the exercise?
    const currentLabelsPromise = prisma.label.findMany({
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
    return prisma.exercise.update({
      where: {
        id
      },
      data: {
        title,
        languageCode,
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
});
