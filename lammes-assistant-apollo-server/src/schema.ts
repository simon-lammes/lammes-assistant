import {
  arg,
  enumType,
  inputObjectType,
  intArg,
  list,
  makeSchema,
  nonNull,
  nullable,
  objectType,
  stringArg
} from '@nexus/schema'
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
import {
  createExercise,
  fetchMyExercises,
  fetchMyNextExperience,
  getExerciseDownloadLink,
  registerExerciseExperience
} from "./operations/exercise-operations";

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
    t.model.creator();
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

export const ExerciseFragment = inputObjectType({
  name: 'ExerciseFragment',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.string('type');
  },
})

const Exercise = objectType({
  name: 'Exercise',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.creatorId();
    t.model.creator();
    t.model.versionTimestamp();
    t.model.key();
  }
});

const Experience = objectType({
  name: 'Experience',
  definition(t) {
    t.model.exerciseId();
    t.model.learnerId();
    t.model.exercise();
    t.model.lastStudiedTimestamp();
    t.model.correctStreak();
  }
});

const ExerciseResult = enumType({
  name: 'ExerciseResult',
  members: ['FAILURE', 'SUCCESS'],
  description: 'Results describing how a learner coped with an exercise. Through the use of an enum we make sure that further characteristics can easily added in the future.',
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
    t.list.field('myExercises', {
      type: "Exercise",
      resolve: (root, args, context) => {
        return fetchMyExercises(context);
      }
    });
    t.field('myNextExperience', {
      type: "Experience",
      resolve: (root, args, context) => {
        return fetchMyNextExperience(context);
      }
    });
    t.field('getExerciseDownloadLink', {
      type: "String",
      args: {
        exerciseKey: nonNull(stringArg())
      },
      resolve: (root, args, context) => {
        return getExerciseDownloadLink(context, args.exerciseKey);
      }
    })
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
    });
    t.field("createExercise", {
      type: "Exercise",
      args: {
        title: nonNull(stringArg()),
        assignmentFragments: nonNull(list(ExerciseFragment)),
        solutionFragments: nonNull(list(ExerciseFragment)),
      },
      resolve: (root, args, context) => {
        return createExercise(context, args);
      }
    });
    t.field("registerExerciseExperience", {
      type: "Experience",
      args: {
        exerciseKey: nonNull(stringArg()),
        exerciseResult: nonNull(arg({type: ExerciseResult}))
      },
      resolve: (root, args, context) => {
        return registerExerciseExperience(context, args.exerciseKey, args.exerciseResult);
      }
    });
  },
})

export const schema = makeSchema({
  types: [Query, Mutation, User, Note, Registration, Exercise, Experience],
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
