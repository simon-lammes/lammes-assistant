import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {first, map, switchMap, tap} from 'rxjs/operators';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Storage} from '@ionic/storage';
import {ExerciseCooldown} from '../settings/settings.service';
import {ActivatedRoute} from '@angular/router';
import {isNumeric} from 'rxjs/internal-compatibility';

export type ExerciseType = 'standard' | 'trueOrFalse' | 'multiselect' | 'ordering' | 'prompt' | 'directedGraphAssembly' | 'mapping';

export type ExerciseResult = 'FAILURE' | 'SUCCESS';

/**
 * A file stored within an exercise.
 */
export interface CustomFile {
  name: string;
  value: string;
}

export interface PossibleAnswer {
  value: string;
  correct: boolean;
  explanation: string;
}

export interface PromptSolution {
  value: string;
}

export type LanguageCodeIso639_1 = 'en' | 'de';

/**
 * A heavier type than a regular exercise. This type can consist binary files associated with the exercise and is therefore not
 * saved in a relational database.
 */
export interface HydratedExercise {
  orderingItems: string[];
  id: number;
  title: string;
  versionTimestamp: string;
  assignment: string;
  solution: string;
  exerciseType: ExerciseType;
  isStatementCorrect?: boolean;
  possibleAnswers: PossibleAnswer[];
  promptSolutions: PromptSolution[];
  nodes: { id: string, label: string }[];
  edges: { id: string, label: string, source: string, target: string }[];
  targets: { id: string, label: string }[];
  sources: { label: string, targets: string[], explanation?: string }[];
  files: CustomFile[];
  labels?: string[];
  languageCode: LanguageCodeIso639_1;
  groupIds?: number[];
}

export interface Exercise {
  id: number;
  creatorId: number;
  title: string;
  versionTimestamp: string;
  markedForDeletionTimestamp: string;
  exerciseLabels: {
    label: {
      id: string;
      title: string;
    };
  }[];
  languageCode: LanguageCodeIso639_1;
}

export interface Experience {
  correctStreak: number;
  exercise: Exercise;
}

export interface ExerciseFilter {
  id: number;
  title: string;
  exerciseFilterDefinition: ExerciseFilterDefinition;
}

/**
 * The user might want to filter for specific exercises.
 */
export interface ExerciseFilterDefinition {
  labels?: string[];
  groupIds: number[];
  creatorIds?: number[];
  languageCodes?: LanguageCodeIso639_1[];
  exerciseTypes?: ExerciseType[];
  maximumCorrectStreak: number;
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
    versionTimestamp,
    markedForDeletionTimestamp,
    creatorId,
    exerciseLabels {
      label {
        title
      }
    },
    languageCode
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

const exerciseFilterFragment = gql`
  fragment ExerciseFilterFragment on ExerciseFilter {
    id,
    title,
    exerciseFilterDefinition
  }
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
  mutation CreateExercise($hydratedExerciseInput: HydratedExerciseInput!) {
    createExercise(hydratedExerciseInput: $hydratedExerciseInput) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const updateExerciseMutation = gql`
  mutation UpdateExercise($id: Int!, $hydratedExerciseInput: HydratedExerciseInput!) {
    updateExercise(id: $id, hydratedExerciseInput: $hydratedExerciseInput) {
      ...ExerciseFragment
    }
  },
  ${exerciseFragment}
`;

const getExerciseDownloadLinkQuery = gql`
  query GetExerciseDownloadLink($exerciseId: Int!) {
    getExerciseDownloadLink(exerciseId: $exerciseId)
  }
`;

const registerExerciseExperienceMutation = gql`
  mutation RegisterExerciseExperience($exerciseId: Int!, $exerciseResult: ExerciseResult!, $exerciseCorrectStreakCap: Int) {
    registerExerciseExperience(exerciseId: $exerciseId, exerciseResult: $exerciseResult, exerciseCorrectStreakCap: $exerciseCorrectStreakCap) {
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

/**
 * RxJS operator for filling hydrated exercises with default values. This method exists for backwards compatibility reasons.
 * When I added the field "exerciseType", all my existing exercises did not have this field. They implicitly had
 * the exerciseType 'standard'. In order for this application to work with old exercises, those old exercises
 * need to be filled standard values for the new properties.
 */
function complementHydratedExerciseWithDefaultValues() {
  const hydratedExerciseDefaultValues = {
    exerciseType: 'standard',
    languageCode: 'en'
  } as Partial<HydratedExercise>;
  return <T extends HydratedExercise>(source: Observable<T>) => {
    return source.pipe(
      map(hydratedExercise => {
        return {
          ...hydratedExerciseDefaultValues,
          ...hydratedExercise
        } as HydratedExercise;
      })
    );
  };
}

const myExerciseFilters = gql`
  query MyExerciseFilters {
    myExerciseFilters {
      ...ExerciseFilterFragment
    }
  },
  ${exerciseFilterFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  readonly usersExercisesThatAreMarkedForDeletion$ = this.apollo.watchQuery<{ myExercisesThatAreMarkedForDeletion: Exercise[] }>({
    query: usersRemovedExercisesQuery
  }).valueChanges.pipe(
    map(({data}) => data.myExercisesThatAreMarkedForDeletion)
  );

  readonly myExerciseFilters$ = this.apollo.watchQuery<{ myExerciseFilters: ExerciseFilter[] }>({
    query: myExerciseFilters,
  }).valueChanges.pipe(
    map(({data}) => data.myExerciseFilters)
  );

  // Study Progress
  private readonly studyProgressBehaviourSubject = new BehaviorSubject({failureCount: 0, successCount: 0} as StudyProgress);
  readonly studyProgress$ = this.studyProgressBehaviourSubject.asObservable();

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private storage: Storage,
  ) {
  }

  getNextExercise(exerciseCooldown: ExerciseCooldown, exerciseFilterDefinition: ExerciseFilterDefinition) {
    // We need to use watchQuery. The user might edit the exercise and thus, the updated exercise should be emitted.
    return this.apollo.watchQuery<{ myNextExercise: Exercise }>({
      query: gql`
        query MyNextExercise($exerciseCooldown: ExerciseCooldownInput!, $exerciseFilterDefinition: ExerciseFilterDefinition!) {
          myNextExercise(exerciseCooldown: $exerciseCooldown, exerciseFilter: $exerciseFilterDefinition) {
            ...ExerciseFragment
          }
        },
        ${exerciseFragment}
      `,
      variables: {exerciseFilterDefinition, exerciseCooldown},
      // 'Network-only' is the only fetch policy that worked out so far.
      // When we only used the cache, we would be "stuck" with the same exercise.
      // However, we should still use the cache in order to see when the user updated an exercise.
      // However, if we use the caches value first and replace it with the fresh network value, this leads to a weird flickering because
      // those two values are not referring to the same exercise. Network-only is perfect for the aforementioned criteria:
      // 'Save in cache' to recognize changes + 'only use network value' to prevent flickering
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(({data}) => data.myNextExercise)
    );
  }

  async createExercise(hydratedExerciseInput: any): Promise<any> {
    await this.apollo.mutate<{ createExercise: Exercise }, any>({
      mutation: createExerciseMutation,
      variables: {hydratedExerciseInput},
      refetchQueries: ['FilteredExercisesQuery']
    }).toPromise();
  }

  async updateExercise(args: { hydratedExerciseInput, id }): Promise<any> {
    return this.apollo.mutate<{ updateExercise: Exercise }, any>({
      mutation: updateExerciseMutation,
      variables: {
        id: args.id,
        hydratedExerciseInput: args.hydratedExerciseInput
      }
    }).toPromise();
  }

  /**
   * Takes a light Exercise object containing only the "metadata" about the exercise and then loads the corresponding HydratedExercise.
   * For the HydratedExercise, we use our own, very-simple persistent cache because we do not want to fetch those big objects every time.
   */
  async getHydratedExercise(exercise?: Exercise): Promise<HydratedExercise> {
    if (!exercise) {
      return undefined;
    }
    const cacheKey = `hydrated-exercise.${exercise.id}`;
    const cachedHydratedExercise = await from(this.storage.get(cacheKey))
      .pipe(complementHydratedExerciseWithDefaultValues()).toPromise() as HydratedExercise;
    // When the version timestamp of our cached hydrated exercise matches the version timestamp of the provided exercise
    // (coming from current query), we should be assured that the cache is fresh, meaning that it matches the value that is remotely stored.
    const isCacheFresh = cachedHydratedExercise
      && new Date(cachedHydratedExercise.versionTimestamp).getTime() === new Date(exercise.versionTimestamp).getTime();
    if (isCacheFresh) {
      return cachedHydratedExercise;
    } else {
      return this.getExerciseDownloadLink(exercise).pipe(
        switchMap(exerciseUrl => this.http.get<HydratedExercise>(exerciseUrl)),
        complementHydratedExerciseWithDefaultValues(),
        // Cache the result.
        tap(hydratedExercise => this.storage.set(cacheKey, hydratedExercise)),
        first()
      ).toPromise();
    }
  }

  async registerExerciseExperience(args: { exerciseId: number, exerciseResult: ExerciseResult, exerciseCorrectStreakCap?: number }) {
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

  getFilteredExercises(exerciseFilterDefinition: ExerciseFilterDefinition) {
    return this.apollo.watchQuery<{ filteredExercises: Exercise[] }>({
      query: gql`
        query FilteredExercisesQuery($exerciseFilterDefinition: ExerciseFilterDefinition!) {
          filteredExercises(exerciseFilter: $exerciseFilterDefinition) {
            ...ExerciseFragment
          }
        },
        ${exerciseFragment}
      `,
      variables: {exerciseFilterDefinition},
      // When user changed exercise resources, this query needs to update.
      // Solely using refetchQueries would not suffice because this targets only single queries.
      // However, there could be thousand caches of this query, all with different input variables.
      fetchPolicy: 'cache-and-network',
    }).valueChanges.pipe(
      map(({data}) => data.filteredExercises),
      // Sort the labels client-side because it is easier!
      map(exercises => exercises.map(exercise => {
        return {
          ...exercise,
          exerciseLabels: [...exercise.exerciseLabels].sort((a, b) => a.label.title.localeCompare(b.label.title))
        };
      })),
    );
  }

  suspendExperience(exerciseId: number) {
    return this.apollo.mutate({
      mutation: gql`
        mutation SuspendExperience($exerciseId: Int!) {
          suspendExperience(exerciseId: $exerciseId) {
            exerciseId
          }
        }
      `,
      variables: {
        exerciseId
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
        exerciseId: exercise.id
      }
    }).valueChanges.pipe(
      map(({data}) => data.getExerciseDownloadLink)
    );
  }

  async createExerciseFilter(title: string, exerciseFilterDefinition: ExerciseFilterDefinition) {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateExerciseFilter($title: String!, $exerciseFilterDefinition: ExerciseFilterDefinition!) {
          createExerciseFilter(title: $title, exerciseFilterDefinition: $exerciseFilterDefinition) {
            ...ExerciseFilterFragment
          }
        },
        ${exerciseFilterFragment}
      `,
      refetchQueries: ['MyExerciseFilters'],
      variables: {title, exerciseFilterDefinition}
    }).toPromise();
  }

  async updateExerciseFilter(filter: ExerciseFilter) {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateExerciseFilter($id: Int!, $title: String!, $exerciseFilterDefinition: ExerciseFilterDefinition!) {
          updateExerciseFilter(id: $id, title: $title, exerciseFilterDefinition: $exerciseFilterDefinition) {
            ...ExerciseFilterFragment
          }
        },
        ${exerciseFilterFragment}
      `,
      refetchQueries: ['MyExerciseFilters'],
      variables: filter
    }).toPromise();
  }

  async deleteExerciseFilter(filterToDelete: ExerciseFilter) {
    return this.apollo.mutate<{deleteExerciseFilter: ExerciseFilter}>({
      mutation: gql`
        mutation DeleteExerciseFilter($id: Int!) {
          deleteExerciseFilter(id: $id) {
            id
          }
        }
      `,
      variables: {id: filterToDelete.id},
      update: (cache, mutationResult) => {
        const idOfDeleted = mutationResult.data.deleteExerciseFilter.id;
        const oldCache = cache.readQuery({query: myExerciseFilters}) as {myExerciseFilters: ExerciseFilter[]};
        const newValue = oldCache.myExerciseFilters.filter(x => x.id !== idOfDeleted);
        cache.writeQuery({query: myExerciseFilters, data: {myExerciseFilters: newValue}});
      }
    }).toPromise();
  }

  extractExerciseFilterDefinitionFromQueryParamMap(activatedRoute: ActivatedRoute) {
    return activatedRoute.queryParamMap.pipe(
      map((params) => {
        return {
          labels: params.getAll('labels'),
          groupIds: params.getAll('groupIds').map(stringValue => +stringValue),
          creatorIds: params.getAll('creatorIds').map(labelString => +labelString),
          languageCodes: params.getAll('languageCodes'),
          maximumCorrectStreak: isNumeric(params.get('maximumCorrectStreak')) ? +params.get('maximumCorrectStreak') : undefined,
          exerciseTypes: params.getAll('exerciseTypes')
        } as ExerciseFilterDefinition;
      })
    );
  }
}
