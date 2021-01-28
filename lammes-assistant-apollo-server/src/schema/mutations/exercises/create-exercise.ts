import {arg, booleanArg, list, mutationField, nonNull, nullable, stringArg} from "@nexus/schema";
import {ExerciseType} from "../../types/exercise-type";
import {LanguageCodeEnumType} from "../../types/language-code";
import {AuthenticationError, UserInputError} from "apollo-server";
import {generateUnnecessaryWhitespacesError} from "../../../custom-errors/unnecessary-whitespaces-error";
import {Exercise} from "@prisma/client";
import {CustomFile} from "../../types/custom-file";
import {PossibleAnswer} from "../../types/possible-answer";
import {HydratedExercise} from "../../types/hydrated-exercise";
import {exerciseObjectType} from "../../types/exercise";
import {validateExerciseFiles} from "../../../utils/validators/exercise-validation/exercise-file-validation";
import {validateExercise} from "../../../utils/validators/exercise-validation";

export const createExercise = mutationField('createExercise', {
  type: exerciseObjectType,
  args: {
    title: nonNull(stringArg()),
    assignment: nonNull(stringArg()),
    solution: nonNull(stringArg()),
    exerciseType: nonNull(arg({type: ExerciseType})),
    files: nonNull(list(arg({type: CustomFile}))),
    labels: nonNull(list(nonNull(stringArg()))),
    isStatementCorrect: nullable(booleanArg()),
    possibleAnswers: nullable(list(arg({type: PossibleAnswer}))),
    languageCode: nonNull(arg({type: LanguageCodeEnumType})),
    orderingItems: nullable(list(nonNull(stringArg())))
  },
  resolve: async (
    root,
    {
      title,
      assignment,
      solution,
      exerciseType,
      isStatementCorrect,
      files,
      labels,
      possibleAnswers,
      languageCode,
      orderingItems
    }, {jwtPayload, prisma, spacesClient, applicationConfiguration}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only create exercises when you are authenticated.');
    }
    validateExercise(applicationConfiguration, {files, title});
    const versionTimestamp = new Date();
    const exercise: Exercise = await prisma.exercise.create({
      data: {
        title,
        versionTimestamp: versionTimestamp.toISOString(),
        creator: {
          connect: {id: userId}
        },
        languageCode,
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
      possibleAnswers,
      languageCode,
      orderingItems
    } as HydratedExercise;
    const upload = spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: `exercises/exercise-${exercise.id}.json`,
      Body: JSON.stringify(hydratedExercise),
      ContentType: "application/json",
      ACL: "private"
    });
    await upload.promise();
    return exercise;
  }
});
