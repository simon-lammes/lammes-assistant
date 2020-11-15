import {makeSchema, objectType, stringArg} from '@nexus/schema'
import { AuthenticationError } from 'apollo-server';
import {nexusPrisma} from 'nexus-plugin-prisma'
import {SignupInput, UserOperations} from "./operations/user";

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id();
    t.model.firstName();
    t.model.lastName();
    t.model.username();
  },
})

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.list.field('users', {
      type: "User",
      resolve: (root, args, {jwtPayload, prisma}) => {
        if (!jwtPayload?.username) {
          throw new AuthenticationError('Must be signed in to view users');
        }
        return prisma.user.findMany();
      }
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field("signupUser", {
      type: "User",
      args: {
        firstName: stringArg({nullable: false}),
        lastName: stringArg({nullable: false}),
        username: stringArg({nullable: false}),
        password: stringArg({nullable: false})
      },
      resolve: async (_, inputs: SignupInput, context) => {
        return UserOperations.signup(context.prisma.user, inputs);
      }
    });
    t.field("login", {
      type: "String",
      args: {
        username: stringArg({nullable: false}),
        password: stringArg({nullable: false})
      },
      resolve: async (_, inputs, context) => {
        return UserOperations.login(context.prisma.user, inputs);
      }
    });
  },
})

export const schema = makeSchema({
  types: [Query, Mutation, User],
  plugins: [nexusPrisma({experimentalCRUD: true})],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '@prisma/client',
        alias: 'prisma',
      },
      {
        source: require.resolve('./context'),
        alias: 'Context',
      },
    ],
  },
})
