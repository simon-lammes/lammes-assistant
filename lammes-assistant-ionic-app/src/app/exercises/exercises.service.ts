import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {GraphQLError} from 'graphql';

export enum CreateExerciseResult {
  Success,
  Conflict
}

export interface Exercise {
  id: number;
  title: string;
}

/**
 * Specifies which data we want when querying or mutating exercises. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const exerciseFragment = gql`
  fragment ExerciseFragment on Exercise {
    id,
    title
  }
`;

const usersExercisesQuery = gql`
  query UsersExercisesQuery {
    myExercises {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const createExerciseMutation = gql`
  mutation CreateExercise($title: String!, $assignment: Upload!, $solution: Upload!) {
    createExercise(title: $title, assignment: $assignment, solution: $solution) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {

  readonly usersExercises$ = this.apollo.watchQuery<{ myExercises: Exercise[] }>({query: usersExercisesQuery}).valueChanges.pipe(
    map(({data}) => data.myExercises)
  );

  constructor(
    private apollo: Apollo
  ) {
  }

  async createExercise(exerciseData: any): Promise<CreateExerciseResult> {
    const {data, errors} = await this.apollo.mutate<{ createExercise: Exercise }, any>({
      mutation: createExerciseMutation,
      variables: exerciseData,
      errorPolicy: 'all',
      update: (cache, mutationResult) => {
        if (mutationResult.errors) {
          return;
        }
        const cachedExercises = (cache.readQuery({query: usersExercisesQuery}) as { myExercises: Exercise[] }).myExercises;
        const newExercise = mutationResult.data.createExercise;
        const updatedCachedExercises = [...cachedExercises, newExercise];
        cache.writeQuery({query: usersExercisesQuery, data: {myExercises: updatedCachedExercises}});
      },
      context: {
        // The following configuration is required for the multipart request to work.
        // Sadly, that property is not strongly typed and insufficiently documented in my opinion.
        // Here is what I found: https://stackoverflow.com/a/57388334/12244272,
        // https://github.com/jaydenseric/apollo-upload-client/issues/44#issuecomment-481536380
        useMultipart: true
      }
    }).toPromise();
    if (data.createExercise) {
      return CreateExerciseResult.Success;
    }
    if (errors.some((e: GraphQLError) => e.extensions.code === 'CONFLICT')) {
      return CreateExerciseResult.Conflict;
    }
    throw Error('Unhandled situation');
  }
}
