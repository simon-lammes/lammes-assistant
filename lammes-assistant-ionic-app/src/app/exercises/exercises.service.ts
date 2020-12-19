import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map, switchMap} from 'rxjs/operators';
import {GraphQLError} from 'graphql';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

export enum CreateExerciseResult {
  Success,
  Conflict
}

export type ExerciseResult = 'FAILURE' | 'SUCCESS';

/**
 * A heavier type than a regular exercise. This type can consist binary files associated with the exercise and is therefore not
 * saved in a relational database.
 */
export interface HydratedExercise {
  title: string;
  versionTimestamp: string;
  encodedAssignment: string;
  encodedSolution: string;
}

export interface Exercise {
  id: number;
  title: string;
  key: string;
}

export interface Experience {
  correctStreak: number;
  exercise: Exercise;
}

/**
 * Specifies which data we want when querying or mutating exercises. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const exerciseFragment = gql`
  fragment ExerciseFragment on Exercise {
    id,
    title,
    key
  }
`;

/**
 * Specifies which data we want when querying or mutating experience. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const experienceFragment = gql`
  fragment ExperienceFragment on Experience {
    correctStreak,
    exercise {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
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

const usersNextExperienceQuery = gql`
  query MyNextExperience {
    myNextExperience {
      ...ExperienceFragment
    }
  },
  ${experienceFragment}
`;

const getExerciseDownloadLinkQuery = gql`
  query GetExerciseDownloadLink($exerciseKey: String!) {
    getExerciseDownloadLink(exerciseKey: $exerciseKey)
  }
`;

const registerExerciseExperienceMutation = gql`
  mutation RegisterExerciseExperience($exerciseKey: String!, $exerciseResult: ExerciseResult!) {
    registerExerciseExperience(exerciseKey: $exerciseKey, exerciseResult: $exerciseResult) {
      ...ExperienceFragment
    }
  },
  ${experienceFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {

  readonly usersNextExperience$ = this.apollo.watchQuery<{ myNextExperience: Experience }>({query: usersNextExperienceQuery})
    .valueChanges.pipe(
      map(({data}) => data.myNextExperience)
    );

  readonly usersExercises$ = this.apollo.watchQuery<{ myExercises: Exercise[] }>({query: usersExercisesQuery}).valueChanges.pipe(
    map(({data}) => data.myExercises)
  );

  constructor(
    private apollo: Apollo,
    private http: HttpClient
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

  getHydratedExercise(exercise: Exercise): Observable<HydratedExercise> {
    return this.getExerciseDownloadLink(exercise).pipe(
      switchMap(exerciseUrl => this.http.get<HydratedExercise>(exerciseUrl))
    );
  }

  private getExerciseDownloadLink(exercise: Exercise): Observable<string> {
    return this.apollo.watchQuery<{ getExerciseDownloadLink: string }>({
      query: getExerciseDownloadLinkQuery,
      variables: {
        exerciseKey: exercise.key
      }
    }).valueChanges.pipe(
      map(({data}) => data.getExerciseDownloadLink)
    );
  }

  registerExerciseExperience(args: {exerciseKey: string, exerciseResult: ExerciseResult}) {
    return this.apollo.mutate<{ registerExerciseExperience: Exercise }, any>({
      mutation: registerExerciseExperienceMutation,
      variables: args,
      refetchQueries: [
        {
          // When the user is finished with an exercise, he wants the next one.
          query: usersNextExperienceQuery
        }
      ]
    }).toPromise();
  }
}
