import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {first, map, switchMap, tap} from 'rxjs/operators';
import {GraphQLError} from 'graphql';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Storage} from '@ionic/storage';
import {SettingsService} from '../settings/settings.service';

export enum CreateExerciseResult {
  Success,
  Conflict
}

export type ExerciseResult = 'FAILURE' | 'SUCCESS';

/**
 * The idea is that an parts of an exercise can consist of different "fragment". For example as an assignment, you could have
 * a short assignment text followed by a little graphic in pdf format.
 */
export interface ExerciseFragment {
  type: 'text' | 'file';
  value: string;
}

/**
 * A heavier type than a regular exercise. This type can consist binary files associated with the exercise and is therefore not
 * saved in a relational database.
 */
export interface HydratedExercise {
  title: string;
  versionTimestamp: string;
  assignmentFragments: ExerciseFragment[];
  solutionFragments: ExerciseFragment[];
}

export interface Exercise {
  id: number;
  title: string;
  key: string;
  versionTimestamp: string;
  markedForDeletionTimestamp: string;
}

export interface Experience {
  correctStreak: number;
  exercise: Exercise;
}

/**
 * Tracks the current progress of the user study session.
 */
export interface StudyProgress {
  successCount: number;
  failureCount: number;
}

/**
 * Specifies which data we want when querying or mutating exercises. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const exerciseFragment = gql`
  fragment ExerciseFragment on Exercise {
    id,
    title,
    key,
    versionTimestamp,
    markedForDeletionTimestamp
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

const usersRemovedExercisesQuery = gql`
  query UsersRemovedExercisesQuery {
    myExercisesThatAreMarkedForDeletion {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const createExerciseMutation = gql`
  mutation CreateExercise($title: String!, $assignmentFragments: [ExerciseFragment]!, $solutionFragments: [ExerciseFragment]!) {
    createExercise(title: $title, assignmentFragments: $assignmentFragments, solutionFragments: $solutionFragments) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const usersNextExperienceQuery = gql`
  query MyNextExperience($exerciseCooldown: ExerciseCooldown!) {
    myNextExperience(exerciseCooldown: $exerciseCooldown) {
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

const removeExerciseMutation = gql`
  mutation RemoveExercise($id: Int!) {
    removeExercise(id: $id) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const restoreExerciseMutation = gql`
  mutation RestoreExercise($id: Int!) {
    restoreExercise(id: $id) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {

  // Study Progress
  readonly studyProgressBehaviourSubject = new BehaviorSubject({failureCount: 0, successCount: 0} as StudyProgress);
  readonly studyProgress$ = this.studyProgressBehaviourSubject.asObservable();

  /**
   * The users experience that he should work on next while studying. Informally: the next exercise.
   * This observable is "re-triggered" when the study progress changes (the user finished an exercise)
   * and when the user changed the exercise cooldown. The reasons for these triggers can be explained as follows:
   * When the user finishes an exercise, he must start working on the next one.
   * When the user changes the exercise time, the "algorithm" might pick a different (better suited?) exercise.
   */
  readonly usersNextExperience$ = this.studyProgress$.pipe(
    switchMap(() => this.settingsService.exerciseCooldown$),
    switchMap(exerciseCooldown => this.apollo.watchQuery<{ myNextExperience: Experience }>({
      // When we used the cache, we would be "stuck" with the same exercise.
      fetchPolicy: 'no-cache',
      query: usersNextExperienceQuery,
      variables: {exerciseCooldown}
    }).valueChanges),
    map(({data}) => data.myNextExperience)
  );

  readonly usersExercises$ = this.apollo.watchQuery<{ myExercises: Exercise[] }>({query: usersExercisesQuery}).valueChanges.pipe(
    map(({data}) => data.myExercises)
  );

  readonly usersExercisesThatAreMarkedForDeletion$ = this.apollo.watchQuery<{ myExercisesThatAreMarkedForDeletion: Exercise[] }>({
    query: usersRemovedExercisesQuery
  }).valueChanges.pipe(
    map(({data}) => data.myExercisesThatAreMarkedForDeletion)
  );

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private storage: Storage,
    private settingsService: SettingsService
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

  /**
   * Takes a light Exercise object containing only the "metadata" about the exercise and then loads the corresponding HydratedExercise.
   * For the HydratedExercise, we use our own, very-simple persistent cache because we do not want to fetch those big objects every time.
   */
  async getHydratedExercise(exercise?: Exercise): Promise<HydratedExercise> {
    if (!exercise) {
      return undefined;
    }
    const cacheKey = `hydrated-exercise.${exercise.key}`;
    const cachedHydratedExercise = await this.storage.get(cacheKey) as HydratedExercise;
    // When the version timestamp of our cached hydrated exercise matches the version timestamp of the provided exercise
    // (coming from current query), we should be assured that the cache is fresh, meaning that it matches the value that is remotely stored.
    const isCacheFresh = cachedHydratedExercise
      && new Date(cachedHydratedExercise.versionTimestamp).getTime() === new Date(exercise.versionTimestamp).getTime();
    if (isCacheFresh) {
      return cachedHydratedExercise;
    } else {
      return this.getExerciseDownloadLink(exercise).pipe(
        switchMap(exerciseUrl => this.http.get<HydratedExercise>(exerciseUrl)),
        // Cache the result.
        tap(hydratedExercise => this.storage.set(cacheKey, hydratedExercise)),
        first()
      ).toPromise();
    }
  }

  async registerExerciseExperience(args: { exerciseKey: string, exerciseResult: ExerciseResult }) {
    await this.apollo.mutate<{ registerExerciseExperience: Exercise }, any>({
      mutation: registerExerciseExperienceMutation,
      variables: args
    }).toPromise();
    const {exerciseResult} = args;
    this.studyProgressBehaviourSubject.next({
      successCount: this.studyProgressBehaviourSubject.value.successCount + (exerciseResult === 'SUCCESS' ? 1 : 0),
      failureCount: this.studyProgressBehaviourSubject.value.failureCount + (exerciseResult === 'FAILURE' ? 1 : 0),
    });
  }

  async removeExercise(args: { id: number }) {
    await this.apollo.mutate<{ removeExercise: Exercise }, any>({
      mutation: removeExerciseMutation,
      variables: args,
      update: (cache, mutationResult) => {
        const removedExercise = mutationResult.data.removeExercise;
        try {
          const exercisesCache = cache.readQuery({query: usersExercisesQuery}) as { myExercises: Exercise[] };
          const exercises = exercisesCache.myExercises;
          const updatedExercises = exercises.filter(e => e.id !== removedExercise.id);
          cache.writeQuery({query: usersExercisesQuery, data: { myExercises: updatedExercises }});
        } catch (e) {
          // If query was yet not cached, we get an exception.
        }
        try {
          const removedExercisesCache = cache.readQuery({
            query: usersRemovedExercisesQuery
          }) as { myExercisesThatAreMarkedForDeletion: Exercise[] };
          const removedExercises = removedExercisesCache.myExercisesThatAreMarkedForDeletion;
          const updatedRemovedExercises = [removedExercise, ...removedExercises];
          cache.writeQuery({query: usersRemovedExercisesQuery, data: {myExercisesThatAreMarkedForDeletion: updatedRemovedExercises}});
        } catch (e) {
          // If query was yet not cached, we get an exception.
        }
      }
    }).toPromise();
  }

  async restoreExercise(args: { id: number }) {
    await this.apollo.mutate<{ restoreExercise: Exercise }, any>({
      mutation: restoreExerciseMutation,
      variables: args,
      update: (cache, mutationResult) => {
        const restoredExercise = mutationResult.data.restoreExercise;
        try {
          const exercisesCache = cache.readQuery({query: usersExercisesQuery}) as { myExercises: Exercise[] };
          const exercises = exercisesCache.myExercises;
          const updatedExercises = [...exercises, restoredExercise];
          updatedExercises.sort((a, b) => a.title.localeCompare(b.title));
          cache.writeQuery({query: usersExercisesQuery, data: {myExercises: updatedExercises}});
        } catch (e) {
          // If query was yet not cached, we get an exception.
        }
        try {
          const removedExercisesCache = cache.readQuery({
            query: usersRemovedExercisesQuery
          }) as { myExercisesThatAreMarkedForDeletion: Exercise[] };
          const removedExercises = removedExercisesCache.myExercisesThatAreMarkedForDeletion;
          const updatedRemovedExercises = removedExercises.filter(e => e.id !== restoredExercise.id);
          cache.writeQuery({query: usersRemovedExercisesQuery, data: {myExercisesThatAreMarkedForDeletion: updatedRemovedExercises}});
        } catch (e) {
          // If query was yet not cached, we get an exception.
        }
      }
    }).toPromise();
  }

  private getExerciseDownloadLink(exercise: Exercise): Observable<string> {
    return this.apollo.watchQuery<{ getExerciseDownloadLink: string }>({
      // As the download link is only short-lived (meaning it expires), we should not use a cache.
      // If we used a cache, we might end up using an expired download link.
      fetchPolicy: 'no-cache',
      query: getExerciseDownloadLinkQuery,
      variables: {
        exerciseKey: exercise.key
      }
    }).valueChanges.pipe(
      map(({data}) => data.getExerciseDownloadLink)
    );
  }
}
