import { PrismaClient } from '@prisma/client'
import {ExpressContext} from "apollo-server-express/src/ApolloServer";
import {JwtPayload, UserOperations} from "./operations/user";

const prisma = new PrismaClient()

/**
 * An object that is created for every request so that it can be used by the resolvers.
 * It can contain information about the request.
 */
export interface Context {

  /**
   * A DAO created by the Prisma library.
   */
  prisma: PrismaClient;

  /**
   * When the user has sent an JWT token in the Authorization Header and the JWT token has been verified,
   * the JWT tokens payload is put inside this object.
   */
  jwtPayload: JwtPayload | undefined;
}

export function createContext({req}: ExpressContext): Context {
  const token = req.headers.authorization;
  const jwtPayload = UserOperations.verifyToken(token);
  return { prisma, jwtPayload };
}
