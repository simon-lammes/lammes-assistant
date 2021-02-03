import {arg, mutationField, nonNull, stringArg} from "@nexus/schema";
import {ExerciseFilterDefinition, exerciseFilterObjectType} from "../../types/exercise-filter-definition";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const createExerciseFilter = mutationField('createExerciseFilter', {
  type: exerciseFilterObjectType,
  args: {
    title: nonNull(stringArg()),
    exerciseFilterDefinition: nonNull(arg({type: ExerciseFilterDefinition}))
  },
  resolve: async (
    root,
    {exerciseFilterDefinition, title},
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.exerciseFilter.create({
      data: {
        title,
        exerciseFilterDefinition,
        creator: {connect: {id: userId}}
      }
    });
  }
});
