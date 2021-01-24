import {mutationField, nonNull, stringArg} from "@nexus/schema";
import {generateConflictError} from "../../../custom-errors/collision-error";
import * as bcrypt from "bcrypt";
import {generateJwtToken} from "../../../utils/jwt-utils";
import {registrationObjectType} from "../../types/registration";

export const registerMutation = mutationField("register", {
  type: registrationObjectType,
  args: {
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    username: nonNull(stringArg()),
    password: nonNull(stringArg())
  },
  resolve: async (_, {firstName, lastName, password, username}, {prisma}) => {
    const userWithSameUsername = await prisma.user.findFirst({where: {username}});
    if (userWithSameUsername) {
      throw generateConflictError("A user with that username already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        hashedPassword
      }
    });
    return {
      user,
      jwtToken: generateJwtToken(user.id)
    }
  }
});
