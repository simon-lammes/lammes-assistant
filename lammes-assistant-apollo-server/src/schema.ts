import {makeSchema, objectType, stringArg} from '@nexus/schema'
import {AuthenticationError} from 'apollo-server';
import {nexusPrisma} from 'nexus-plugin-prisma'
import {login, register, SignupInput} from "./operations/user-operations";
import {createNote} from "./operations/note-operations";

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id();
    t.model.firstName();
    t.model.lastName();
    t.model.username();
    t.model.notes();
  },
});

const Note = objectType({
  name: 'Note',
  definition(t) {
    t.model.id();
    t.model.text();
    t.model.creatorId();
    t.model.user();
  },
});

const Registration = objectType({
  name: 'Registration',
  definition(t) {
    t.field('jwtToken', {
      type: 'String'
    });
    t.field('user', {
      type: "User"
    });
  }
})

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.list.field('users', {
      type: "User",
      resolve: (root, args, {jwtPayload, prisma}) => {
        if (!jwtPayload?.userId) {
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
    t.field("register", {
      type: "Registration",
      args: {
        firstName: stringArg({nullable: false}),
        lastName: stringArg({nullable: false}),
        username: stringArg({nullable: false}),
        password: stringArg({nullable: false})
      },
      resolve: async (_, inputs: SignupInput, context) => {
        return register(context.prisma.user, inputs);
      }
    });
    t.field("login", {
      type: "String",
      args: {
        username: stringArg({nullable: false}),
        password: stringArg({nullable: false})
      },
      resolve: async (_, inputs, context) => {
        return login(context.prisma.user, inputs);
      }
    });
    t.field("createNote", {
      type: "Note",
      args: {
        text: stringArg({nullable: false}),
      },
      resolve: async (_, inputs, context) => {
        return createNote(context, inputs);
      }
    });
  },
})

export const schema = makeSchema({
  types: [Query, Mutation, User, Note, Registration],
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
