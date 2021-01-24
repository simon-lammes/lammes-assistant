import {mutationField, nonNull, stringArg} from "@nexus/schema";
import {generateNotFoundError} from "../../../custom-errors/not-found-error";
import * as bcrypt from "bcrypt";
import {AuthenticationError} from "apollo-server";
import {generateJwtToken} from "../../../utils/jwt-utils";

export const loginMutation = mutationField("login", {
  type: "String",
  args: {
    username: nonNull(stringArg()),
    password: nonNull(stringArg())
  },
  resolve: async (_, {username, password}, {prisma}) => {
    const user = await prisma.user.findFirst({where: {username}});
    if (!user) {
      throw generateNotFoundError('User with that username does not exist.');
    }
    const hashedPassword = user.hashedPassword;
    const rightPassword = await bcrypt.compare(password, hashedPassword);
    if (!rightPassword) {
      throw new AuthenticationError('Wrong Password');
    }
    return generateJwtToken(user.id);
  }
});
