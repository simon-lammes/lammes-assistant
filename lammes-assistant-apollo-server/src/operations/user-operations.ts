import {User} from "@prisma/client";
import {ApolloError, AuthenticationError} from "apollo-server";
import {environment} from "../environment";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {Context} from "../context";

/**
 * The required input for creating a new user.
 */
export interface SignupInput {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

/**
 * The required information for signing in.
 */
export interface SignInInput {
  username: string;
  password: string;
}

/**
 * The payload of every JWT token that is generated by this application.
 */
export interface JwtPayload {
  userId: number;
}

export async function register(context: Context, {firstName, lastName, username, password}: SignupInput): Promise<{ user: User, jwtToken: string }> {
  const userDao = context.prisma.user;
  const userWithSameUsername = await userDao.findFirst({where: {username}});
  if (userWithSameUsername) {
    throw new ApolloError("A user with that username already exists", "USERNAME_COLLISION");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await userDao.create({
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

export async function login(context: Context, {username, password}: SignInInput): Promise<string> {
  const userDao = context.prisma.user;
  const user = await userDao.findFirst({where: {username}});
  if (!user) {
    throw new AuthenticationError('User with that username does not exist.');
  }
  const hashedPassword = user.hashedPassword;
  const rightPassword = await bcrypt.compare(password, hashedPassword);
  if (!rightPassword) {
    throw new AuthenticationError('Wrong Password');
  }
  return generateJwtToken(user.id);
}


export function verifyToken(token: string | undefined): JwtPayload | undefined {
  if (!token) {
    return undefined;
  }
  try {
    // 'Bearer xyz' should become just 'xyz'.
    const bearerToken = token.slice(7);
    return jwt.verify(bearerToken, environment.SECRET) as JwtPayload;
  } catch (e) {
    throw new AuthenticationError('The Authorization Header of your request was set but could not be verified. It might be expired.')
  }
}

function generateJwtToken(userId: number) {
  return jwt.sign({userId} as JwtPayload, environment.SECRET, {expiresIn: '2 days'});
}
