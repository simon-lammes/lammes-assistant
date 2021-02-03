import {intArg, mutationField, nonNull} from "@nexus/schema";
import {exerciseObjectType} from "../../types/exercise";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const suspendExperience = mutationField("suspendExperience", {
  type: "Experience",
  description: "Manually update an experience entity.",
  args: {
    exerciseId: nonNull(intArg())
  },
  resolve: async (root, {exerciseId}, {jwtPayload, prisma}) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.experience.update({
      where: {
        exerciseId_learnerId: {
          exerciseId,
          learnerId: userId
        }
      },
      data: {
        suspendedTimestamp: new Date()
      }
    });
  }
});
