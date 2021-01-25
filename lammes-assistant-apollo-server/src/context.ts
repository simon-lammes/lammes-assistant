import {PrismaClient} from '@prisma/client'
import {ExpressContext} from "apollo-server-express/src/ApolloServer";
import AWS from "aws-sdk";
import {environment} from "./environment";
import {JwtPayload, verifyToken} from "./utils/jwt-utils";

const prisma = new PrismaClient();

const spacesClient = new AWS.S3({
  endpoint: new AWS.Endpoint(environment.SPACES_ENDPOINT),
  accessKeyId: environment.SPACES_KEY,
  secretAccessKey: environment.SPACES_SECRET,
  s3ForcePathStyle: true
});

/**
 * This object holds the **default** values that are used when they are not overridden.
 */
const defaultApplicationConfiguration: ApplicationConfiguration = {
  minPasswordLength: 6,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/svg+xml']
}

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

  /**
   * The client to access DigitalOcean Spaces for storing binary files. As this product is AWS S3 compliant, we are
   * using the AWS library as the Spaces documentation suggests.
   */
  spacesClient: AWS.S3;

  applicationConfiguration: ApplicationConfiguration
}

/**
 * Documented in GraphQL schema.
 */
export interface ApplicationConfiguration {
  minPasswordLength: number;
  allowedFileTypes: string[];
}

export function createContext({req}: ExpressContext): Context {
  const token = req.headers.authorization;
  const jwtPayload = verifyToken(token);
  // Currently, we just use the default config because overriding is not yet implemented.
  const applicationConfiguration = defaultApplicationConfiguration;
  return { prisma, jwtPayload, spacesClient, applicationConfiguration };
}
