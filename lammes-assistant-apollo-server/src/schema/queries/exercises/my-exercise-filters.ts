import {queryField} from "@nexus/schema";
import {exerciseFilterObjectType} from "../../types/exercise-filter-definition";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const myExerciseFilters = queryField('myExerciseFilters', {
  type: exerciseFilterObjectType,
  list: true,
  resolve: async (
    root,
    args,
    {jwtPayload, prisma}
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.exerciseFilter.findMany({
      where: {
        creatorId: userId
      }
    })
  }
});
