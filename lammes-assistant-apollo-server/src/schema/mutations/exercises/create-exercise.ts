import {arg, mutationField, nonNull} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {Exercise} from "@prisma/client";
import {HydratedExercise, HydratedExerciseInputType} from "../../types/hydrated-exercise";
import {exerciseObjectType} from "../../types/exercise";
import {validateExercise} from "../../../utils/validators/exercise-validation";
import {getHydratedExercisePath} from "../../../utils/object-storage-utils";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";

export const createExercise = mutationField('createExercise', {
  type: exerciseObjectType,
  args: {
    hydratedExerciseInput: nonNull(arg({type: HydratedExerciseInputType}))
  },
  resolve: async (
    root,
    {hydratedExerciseInput},
    {jwtPayload, prisma, spacesClient, applicationConfiguration}
  ) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You can only create exercises when you are authenticated.');
    }
    validateExercise(applicationConfiguration, hydratedExerciseInput);
    await validateMembersRole(prisma, userId, 'member', hydratedExerciseInput.groupIds);
    const versionTimestamp = new Date();
    const exercise: Exercise = await prisma.exercise.create({
      data: {
        title: hydratedExerciseInput.title,
        exerciseType: hydratedExerciseInput.exerciseType,
        versionTimestamp: versionTimestamp.toISOString(),
        creator: {
          connect: {id: userId}
        },
        languageCode: hydratedExerciseInput.languageCode,
        exerciseLabels: {
          create: hydratedExerciseInput.labels.map(label => {
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
        groupExercises: {
          create: hydratedExerciseInput.groupIds?.map(groupId => {
            return {
              groupId
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
      ...hydratedExerciseInput,
      id: exercise.id,
      versionTimestamp: versionTimestamp.toISOString()
    } as HydratedExercise;
    const upload = spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: getHydratedExercisePath(exercise),
      Body: JSON.stringify(hydratedExercise),
      ContentType: "application/json",
      ACL: "private"
    });
    await upload.promise();
    return exercise;
  }
});
