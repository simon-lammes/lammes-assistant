import {Action, State, StateContext} from '@ngxs/store';
import {ExerciseCreationFailureReason, ExerciseSaved, ExerciseSavingFailed, SaveExercise} from './exercise.actions';
import {ExerciseService} from '../../services/exercise/exercise.service';
import {Injectable} from '@angular/core';
import {tap} from 'rxjs/operators';
import {GraphQLError} from 'graphql';
import {Observable} from 'rxjs';

export interface ExerciseStateModel {
  items: string[];
}

@State<ExerciseStateModel>({
  name: 'exercise',
  defaults: {
    items: []
  }
})
@Injectable()
export class ExerciseState {

  constructor(
    private exerciseService: ExerciseService
  ) {
  }

  @Action(SaveExercise)
  public saveExercise(ctx: StateContext<ExerciseStateModel>, {exercise, editedExerciseId}: SaveExercise) {
    const saveObservable: Observable<any> = editedExerciseId
      ? this.exerciseService.updateExercise({
        hydratedExerciseInput: exercise,
        id: editedExerciseId
      }) : this.exerciseService.createExercise(exercise);
    return saveObservable.pipe(
      tap(({errors}) => {
        if (!errors) {
          ctx.dispatch(new ExerciseSaved(editedExerciseId));
        } else if (errors.some((e: GraphQLError) => e.extensions.code === 'LANGUAGE_UNDETERMINED')) {
          ctx.dispatch(new ExerciseSavingFailed(exercise, editedExerciseId, ExerciseCreationFailureReason.LanguageUndetermined));
        }
      })
    );
  }
}
