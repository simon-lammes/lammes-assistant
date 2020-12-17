import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';

/**
 * Specifies which data we want when querying or mutating hydrated exercises. We want to ask for the same fields in every query
 * so that our cache for all queries can be updated with all required fields.
 */
const hydratedExerciseFragment = gql`
  fragment HydratedExerciseFragment on HydratedExercise {
    title,
    front,
    back
  }
`;

const createExerciseMutation = gql`
  mutation CreateExercise($title: String!, $front: Upload!, $back: Upload!) {
    createExercise(title: $title, front: $front, back: $back) {
      ...HydratedExerciseFragment
    }
  },
  ${hydratedExerciseFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {

  constructor(
    private apollo: Apollo
  ) {
  }

  createExercise(exerciseData: any): Promise<any> {
    return this.apollo.mutate({
      mutation: createExerciseMutation,
      variables: exerciseData,
      context: {
        // The following configuration is required for the multipart request to work.
        // Sadly, that property is not strongly typed and insufficiently documented in my opinion.
        // Here is what I found: https://stackoverflow.com/a/57388334/12244272,
        // https://github.com/jaydenseric/apollo-upload-client/issues/44#issuecomment-481536380
        useMultipart: true
      }
    }).toPromise();
  }
}
