import {mutationField, nonNull, stringArg} from "@nexus/schema";
import {generateConflictError} from "../../../custom-errors/collision-error";
import * as bcrypt from "bcrypt";
import {generateJwtToken} from "../../../utils/jwt-utils";
import {registrationObjectType} from "../../types/registration";
import {generateUnnecessaryWhitespacesError} from "../../../custom-errors/unnecessary-whitespaces-error";
import {ApolloError, UserInputError} from "apollo-server";

export const registerMutation = mutationField("register", {
  type: registrationObjectType,
  args: {
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    username: nonNull(stringArg()),
    password: nonNull(stringArg())
  },
  resolve: async (_, {firstName, lastName, password, username}, {prisma, applicationConfiguration}) => {
    const userWithSameUsername = await prisma.user.findFirst({where: {username}});
    if (userWithSameUsername) {
      throw generateConflictError("A user with that username already exists");
    }
    if (username.includes(' ') || password.includes(' ')) {
      throw new UserInputError('Username and password should not contain whitespaces');
    }
    if (password.length < applicationConfiguration.minPasswordLength) {
      throw new UserInputError('Password should have at least the length that is specified in the application configuration.');
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
