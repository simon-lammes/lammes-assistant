import {inputObjectType} from "@nexus/schema";
import {PromptSolutionInputType} from "./prompt-solution";
import {CustomFile} from "./custom-file";
import {PossibleAnswer} from "./possible-answer";
import {LanguageCode} from "./language-code";

export interface CustomFile {
  name: string;
  value: string;
}

export interface PossibleAnswer {
  value: string;
  correct: boolean;
}

/**
 * An exercise with all the information belonging to it. A regular "Exercise" only contains light metadata and it saved
 * in the relational database while an "Hydrated Exercise" is a storage-intensive object saved in DigitalOcean Spaces.
 */
export interface HydratedExercise {
  id: number;
  /**
   * Should be usable to determine whether an exercise changed without looking into the "storage-intensive" parts of the exercise.
   */
  versionTimestamp: string;
  title: string;
  assignment: string;
  solution: string;
  files: CustomFile[];
  labels: string[];
  exerciseType: "directedGraphAssembly" | "mapping" | "multiselect" | "ordering" | "prompt" | "standard" | "trueOrFalse";
  isStatementCorrect?: boolean | null;
  possibleAnswers?: PossibleAnswer[] | null;
  orderingItems?: string[] | null;
  languageCode?: LanguageCode | null;
  groupIds?: number[] | null;
  nodes?: ExerciseNode[] | null;
  edges?: ExerciseEdge[] | null;
  targets?: ExerciseTarget[] | null;
  sources?: ExerciseSource[] | null;
}

interface ExerciseNode {
  id: string;
  label: string
}

interface ExerciseEdge {
  id: string;
  label: string;
  source: string;
  target: string;
}

interface ExerciseNode {
  id: string;
  label: string
}

interface ExerciseEdge {
  id: string;
  label: string;
  source: string;
  target: string;
}

interface ExerciseTarget {
  id: string;
  label: string;
}

interface ExerciseSource {
  label: string;
  targets: string[];
  explanation?: string | null;
}


export const HydratedExerciseInputType = inputObjectType({
  name: 'HydratedExerciseInput',
  definition(t) {
    t.nonNull.string('title');
    t.nonNull.string('assignment');
    t.nonNull.string('solution');
    t.nonNull.field('exerciseType', {type: "ExerciseType"});
    t.nonNull.list.field('files', {type: CustomFile});
    t.nonNull.list.nonNull.string('labels');
    t.nullable.field('languageCode', {type: 'LanguageCode', description: 'Can be omitted for automatic detection. But expect that the automatic detection can fail.'});
    t.nullable.boolean('isStatementCorrect');
    t.nullable.list.field('possibleAnswers', {type: PossibleAnswer});
    t.nullable.list.nonNull.string('orderingItems');
    t.nullable.list.nonNull.field('promptSolutions', {type: PromptSolutionInputType});
    t.nullable.list.nonNull.int('groupIds');
    t.nullable.list.nonNull.field('nodes', {type: NodeInputType});
    t.nullable.list.nonNull.field('edges', {type: EdgeInputType});
    t.nullable.list.nonNull.field('targets', {type: TargetInputType});
    t.nullable.list.nonNull.field('sources', {type: SourceInputType});
  },
});

const NodeInputType = inputObjectType({
  name: 'NodeInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('label');
  },
});

const EdgeInputType = inputObjectType({
  name: 'EdgeInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('label');
    t.nonNull.string('source');
    t.nonNull.string('target');
  },
})

const TargetInputType = inputObjectType({
  name: 'TargetInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('label');
  },
});

const SourceInputType = inputObjectType({
  name: 'SourceInput',
  definition(t) {
    t.nonNull.string('label');
    t.nonNull.list.nonNull.string('targets');
    t.nullable.string('explanation');
  },
});
