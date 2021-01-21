import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {ExerciseFilter} from "./exercise-operations";

interface LabelFilter {
  query?: string | null;
}

export async function fetchFilteredLabels(
  {prisma, jwtPayload}: Context,
  {query}: LabelFilter
): Promise<any[]> {
  const userId = jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
  }
  return prisma.label.findMany({
    where: {
      title: query ? {
        contains: query,
        mode: 'insensitive'
      } : undefined
    },
    orderBy: {
      title: 'asc'
    }
  });
}
