import {
  arg,
  booleanArg,
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
import {fetchFilteredUsers, login, register, SignupInput} from "./operations/user-operations";
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
  createExercise, fetchFilteredExercises,
  fetchMyExercisesThatAreMarkedForDeletion, fetchMyNextExercise,
  getExerciseDownloadLink,
  registerExerciseExperience,
  removeExercise,
  restoreExercise,
  updateExercise
} from "./operations/exercise-operations";
import {getCurrentUser, getSettingsDownloadLink, saveSettings} from "./operations/settings-operations";

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id();
    t.model.firstName();
    t.model.lastName();
    t.model.username();
    t.model.notes();
    t.model.settingsUpdatedTimestamp();
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

export const ExerciseCooldown = inputObjectType({
  name: 'ExerciseCooldown',
  definition(t) {
    t.nonNull.int('days');
    t.nonNull.int('hours');
    t.nonNull.int('minutes');
  },
});

const ExerciseLabel = objectType({
  name: 'ExerciseLabel',
  definition(t) {
    t.model.exerciseId();
    t.model.labelId();
    t.model.label();
  }
});

const Exercise = objectType({
  name: 'Exercise',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.creatorId();
    t.model.creator();
    t.model.versionTimestamp();
    t.model.markedForDeletionTimestamp();
    t.model.exerciseLabels();
  }
});

export const CustomFile = nonNull(inputObjectType({
  name: 'CustomFile',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.string('name');
  },
}));

export const PossibleAnswer = nonNull(inputObjectType({
  name: 'PossibleAnswer',
  description: 'For exercise type "multiselect"',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.boolean('correct');
  },
}));

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

const Label = objectType({
  name: 'Label',
  definition(t) {
    t.model.id();
    t.model.title();
  }
});

const ExerciseResult = enumType({
  name: 'ExerciseResult',
  members: ['FAILURE', 'SUCCESS'],
  description: 'Results describing how a learner coped with an exercise. Through the use of an enum we make sure that further characteristics can easily added in the future.',
});

const ExerciseType = enumType({
  name: 'ExerciseType',
  members: ['standard', 'multiselect', 'trueOrFalse']
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
    t.list.field('filteredExercises', {
      type: "Exercise",
      args: {
        creatorIds: nullable(list(nonNull(intArg()))),
        labels: nonNull(list(nonNull(stringArg())))
      },
      resolve: (root, args, context) => {
        return fetchFilteredExercises(context, args);
      }
    });
    t.list.field('filteredUsers', {
      type: "User",
      args: {
        query: nullable(stringArg()),
      },
      resolve: (root, args, context) => {
        return fetchFilteredUsers(context, args);
      }
    });
    t.list.field('myExercisesThatAreMarkedForDeletion', {
      type: "Exercise",
      resolve: (root, args, context) => {
        return fetchMyExercisesThatAreMarkedForDeletion(context);
      }
    });
    t.field('myNextExercise', {
      type: "Exercise",
      args: {
        exerciseCooldown: nonNull(arg({type: ExerciseCooldown})),
        creatorIds: nullable(list(nonNull(intArg()))),
        labels: nullable(list(nonNull(stringArg())))
      },
      resolve: (root, args, context) => {
        return fetchMyNextExercise(context, args.exerciseCooldown, args.creatorIds, args.labels);
      }
    });
    t.field('getExerciseDownloadLink', {
      type: "String",
      args: {
        exerciseId: nonNull(intArg())
      },
      resolve: (root, args, context) => {
        return getExerciseDownloadLink(context, args.exerciseId);
      }
    });
    t.field('getSettingsDownloadLink', {
      type: "String",
      description: "Will be null if the user has no settings yet.",
      nullable: true,
      resolve: (root, args, context) => {
        return getSettingsDownloadLink(context);
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
    });
    t.field('me', {
      type: 'User',
      description: 'Returns the user object that belongs to user making the request.',
      resolve: (root, args, context) => {
        return getCurrentUser(context);
      }
    });
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
        assignment: nonNull(stringArg()),
        solution: nonNull(stringArg()),
        exerciseType: nonNull(arg({type: ExerciseType})),
        files: nonNull(list(arg({type: CustomFile}))),
        labels: nonNull(list(nonNull(stringArg()))),
        isStatementCorrect: nullable(booleanArg()),
        possibleAnswers: nullable(list(arg({type: PossibleAnswer})))
      },
      resolve: (root, args, context) => {
        return createExercise(context, args);
      }
    });
    t.field("updateExercise", {
      type: "Exercise",
      args: {
        id: nonNull(intArg()),
        title: nonNull(stringArg()),
        assignment: nonNull(stringArg()),
        solution: nonNull(stringArg()),
        exerciseType: nonNull(arg({type: ExerciseType})),
        files: nonNull(list(arg({type: CustomFile}))),
        labels: nonNull(list(nonNull(stringArg()))),
        isStatementCorrect: nullable(booleanArg()),
        possibleAnswers: nullable(list(arg({type: PossibleAnswer})))
      },
      resolve: (root, args, context) => {
        return updateExercise(context, args);
      }
    });
    t.field("removeExercise", {
      type: "Exercise",
      description: "Removes an exercise and thereby marks it for deletion. It will be deleted when this action is not reverted within a certain amount of time.",
      args: {
        id: nonNull(intArg()),
      },
      resolve: (root, args, context) => {
        return removeExercise(context, args.id);
      }
    });
    t.field("restoreExercise", {
      type: "Exercise",
      args: {
        id: nonNull(intArg()),
      },
      resolve: (root, args, context) => {
        return restoreExercise(context, args.id);
      }
    });
    t.field("registerExerciseExperience", {
      type: "Experience",
      args: {
        exerciseId: nonNull(intArg()),
        exerciseResult: nonNull(arg({type: ExerciseResult}))
      },
      resolve: (root, args, context) => {
        return registerExerciseExperience(context, args.exerciseId, args.exerciseResult);
      }
    });
    t.field('saveSettings', {
      type: "User",
      args: {
        exerciseCooldown: nonNull(arg({type: ExerciseCooldown})),
        myExerciseLabels: nonNull(list(nonNull(stringArg())))
      },
      resolve: (root, args, context) => {
        return saveSettings(context, args);
      }
    });
  },
})

export const schema = makeSchema({
  types: [Query, Mutation, User, Note, Registration, Exercise, Experience, Label, ExerciseLabel],
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
