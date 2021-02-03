import {arg, intArg, mutationField, nonNull} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import {generateAuthorizationError} from "../../../custom-errors/authorization-error";
import {ExerciseLabelScalarWhereInput} from "@prisma/client";
import {HydratedExercise, HydratedExerciseInputType} from "../../types/hydrated-exercise";
import {exerciseObjectType} from "../../types/exercise";
import {validateExercise} from "../../../utils/validators/exercise-validation";
import {getHydratedExercisePath} from "../../../utils/object-storage-utils";

export const updateExercise = mutationField("updateExercise", {
  type: exerciseObjectType,
  args: {
    id: nonNull(intArg()),
    hydratedExerciseInput: nonNull(arg({type: HydratedExerciseInputType}))
  },
  resolve: async (
    root,
    {
      id,
      hydratedExerciseInput
    },
    {jwtPayload, prisma, spacesClient, applicationConfiguration}
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
    validateExercise(applicationConfiguration, hydratedExerciseInput);
    const versionTimestamp = new Date();
    const hydratedExercise = {
      ...hydratedExerciseInput,
      id,
      versionTimestamp: versionTimestamp.toISOString()
    } as HydratedExercise;
    const upload = spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: getHydratedExercisePath(exercise),
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
    const removeLabels = currentLabels.filter(label => !hydratedExerciseInput.labels.some(x => x === label.title));
    const addedLabels = hydratedExerciseInput.labels.filter(label => !currentLabels.some(x => x.title === label));
    return prisma.exercise.update({
      where: {
        id
      },
      data: {
        title: hydratedExerciseInput.title,
        exerciseType: hydratedExerciseInput.exerciseType,
        languageCode: hydratedExerciseInput.languageCode,
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
