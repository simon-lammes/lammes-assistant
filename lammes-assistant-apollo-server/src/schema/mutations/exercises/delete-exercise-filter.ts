import {arg, intArg, mutationField, nonNull, stringArg} from "@nexus/schema";
import {ExerciseFilterDefinition, exerciseFilterObjectType} from "../../types/exercise-filter-definition";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";

export const deleteExerciseFilter = mutationField('deleteExerciseFilter', {
  type: exerciseFilterObjectType,
  args: {
    id: nonNull(intArg()),
  },
  resolve: async (
    root,
    {id},
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
    return prisma.exerciseFilter.delete({
      where: {
        id
      }
    });
  }
});
