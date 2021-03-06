import {HydratedExercise} from "../schema/types/hydrated-exercise";
import {Context} from "../context";
import {generateLanguageUndeterminedError} from "../custom-errors/language-undetermined";
import {LanguageCode} from "../schema/types";

export async function detectLanguageFromExercise(context: Context, exercise: Partial<HydratedExercise>): Promise<LanguageCode> {
  if (exercise.languageCode) {
    return exercise.languageCode;
  }
  const fragments = [
    exercise.title,
    exercise.assignment,
    exercise.solution,
    exercise.orderingItems,
    exercise.possibleAnswers?.map(answer => answer.value),
    exercise.nodes?.map(node => node.label),
    exercise.edges?.map(edge => edge.label),
    exercise.targets?.map(target => target.label),
    exercise.sources?.map(source => source.label),
    exercise.sources?.map(source => source.explanation)
  ].filter(x => !!x);
  const testString = fragments.join(' ');
  const detectionResult = await context.detectLanguageClient.detect(testString);
  if (detectionResult.length > 0 && detectionResult[0].isReliable && ['en', 'de'].includes(detectionResult[0].language)) {
    return detectionResult[0].language as LanguageCode;
  }
  throw generateLanguageUndeterminedError();
}
