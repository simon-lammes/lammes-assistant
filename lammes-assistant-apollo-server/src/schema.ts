import {intArg, makeSchema, nonNull, nullable, objectType, stringArg} from '@nexus/schema'
import {AuthenticationError} from 'apollo-server';
import {nexusPrisma} from 'nexus-plugin-prisma'
import {login, register, SignupInput} from "./operations/user-operations";
import {
  createNote,
  editNote,
  fetchMyDeferredNotes,
  fetchMyPendingNotes,
  fetchMyResolvedNotes,
  fetchNote,
  resolveNote
} from "./operations/note-operations";

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
    t.model.description();
    t.model.updatedTimestamp();
    t.model.startTimestamp();
    t.model.deadlineTimestamp();
    t.model.resolvedTimestamp();
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
});

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
    });
    t.list.field('myDeferredNotes', {
      type: "Note",
      resolve: (root, args, context) => {
        return fetchMyDeferredNotes(context);
      }
    });
    t.list.field('myPendingNotes', {
      type: "Note",
      resolve: (root, args, context) => {
        return fetchMyPendingNotes(context);
      }
    });
    t.list.field('myResolvedNotes', {
      type: "Note",
      resolve: (root, args, context) => {
        return fetchMyResolvedNotes(context);
      }
    });
    t.field('note', {
      type: 'Note',
      args: {
        id: nonNull(intArg())
      },
      resolve: (root, args, context) => {
        return fetchNote(context, args.id);
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
        firstName: nonNull(stringArg()),
        lastName: nonNull(stringArg()),
        username: nonNull(stringArg()),
        password: nonNull(stringArg())
      },
      resolve: async (_, inputs: SignupInput, context) => {
        return register(context, inputs);
      }
    });
    t.field("login", {
      type: "String",
      args: {
        username: nonNull(stringArg()),
        password: nonNull(stringArg())
      },
      resolve: async (_, inputs, context) => {
        return login(context, inputs);
      }
    });
    t.field("createNote", {
      type: "Note",
      args: {
        text: nonNull(stringArg()),
        description: nullable(stringArg())
      },
      resolve: async (_, inputs, context) => {
        return createNote(context, inputs);
      }
    });
    t.field("resolveNote", {
      type: "Note",
      args: {
        noteId: nonNull(intArg())
      },
      resolve: (root, args, context) => {
        return resolveNote(context, args);
      }
    });
    t.field("editNote", {
      type: "Note",
      args: {
        id: nonNull(intArg()),
        text: nonNull(stringArg()),
        description: nonNull(stringArg()),
        startTimestamp: nullable(stringArg()),
        deadlineTimestamp: nullable(stringArg())
      },
      resolve: (root, args, context) => {
        return editNote(context, args);
      }
    })
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
