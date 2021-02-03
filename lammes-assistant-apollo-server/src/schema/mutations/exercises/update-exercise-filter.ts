import {arg, intArg, mutationField, nonNull, stringArg} from "@nexus/schema";
import {ExerciseFilterDefinition, exerciseFilterObjectType} from "../../types/exercise-filter-definition";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";

export const updateExerciseFilter = mutationField('updateExerciseFilter', {
  type: exerciseFilterObjectType,
  args: {
    id: nonNull(intArg()),
    title: nonNull(stringArg()),
    exerciseFilterDefinition: nonNull(arg({type: ExerciseFilterDefinition}))
  },
  resolve: async (
    root,
    {id, exerciseFilterDefinition, title},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    const exerciseFilter = await prisma.exerciseFilter.findFirst({
      where: {
        id,
        creatorId: userId
      }
    });
    if (!exerciseFilter) {
      throw generateNotFoundError(`Either the exercise filter with id ${id} does not exist or does not belong to you.`);
    }
    return prisma.exerciseFilter.update({
      where: {
        id
      },
      data: {
        title,
        exerciseFilterDefinition,
        creator: {connect: {id: userId}}
      }
    });
  }
});
