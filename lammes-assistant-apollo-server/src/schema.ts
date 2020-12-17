import {arg, intArg, makeSchema, nonNull, nullable, objectType, stringArg} from '@nexus/schema'
import {AuthenticationError} from 'apollo-server';
import {nexusPrisma} from 'nexus-plugin-prisma'
import {login, register, SignupInput} from "./operations/user-operations";
import {
  createNote,
  deleteNote,
  editNote,
  fetchMyDeferredNotes,
  fetchMyPendingNotes,
  fetchMyResolvedNotes,
  fetchNote,
  reopenNote,
  resolveNote
} from "./operations/note-operations";
import {GraphQLUpload} from "graphql-upload";
import {createExercise} from "./operations/exercise-operations";

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
    t.model.title();
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

const HydratedExercise = objectType({
  name: 'HydratedExercise',
  description: '"Hydrated" indicates that objects of this type contain information than their corresponding rows in ' +
    'the relational database. Hydrated exercises contain all their necessary data, even binary files that are not stored ' +
    'in a relational database but a file storage like DigitalOcean Spaces. I want to point out that you could store binary ' +
    'data in a relational database but for cost reasons I decided against it. I also want to point out that I purposefully ' +
    'accept the overhead of base64 encoding because it simplifies persistance of that data client-side (in the future).',
  definition(t) {
    t.field('title', {
      type: 'String',
    });
    t.field('front', {
      type: 'String',
      description: 'Base encoded file that is used for the front (assignment) of the exercise.'
    });
    t.field('back', {
      type: 'String',
      description: 'Base encoded file that is used for the back (solution) of the exercise.'
    })
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
        title: nonNull(stringArg()),
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
    t.field("reopenNote", {
      type: "Note",
      args: {
        noteId: nonNull(intArg())
      },
      resolve: (root, args, context) => {
        return reopenNote(context, args);
      }
    });
    t.field("deleteNote", {
      type: "Note",
      args: {
        noteId: nonNull(intArg())
      },
      resolve: (root, args, context) => {
        return deleteNote(context, args);
      }
    });
    t.field("editNote", {
      type: "Note",
      args: {
        id: nonNull(intArg()),
        title: nullable(stringArg()),
        description: nullable(stringArg()),
        startTimestamp: nullable(stringArg()),
        deadlineTimestamp: nullable(stringArg())
      },
      resolve: (root, args, context) => {
        return editNote(context, args);
      }
    })
    t.field("createExercise", {
      type: "HydratedExercise",
      args: {
        title: nonNull(stringArg()),
        front: nonNull(arg({type: GraphQLUpload})),
        back: nonNull(arg({type: GraphQLUpload})),
      },
      resolve: (root, args, context) => {
        return createExercise(context, args);
      }
    })
  },
})

export const schema = makeSchema({
  types: [Query, Mutation, User, Note, Registration, HydratedExercise],
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
