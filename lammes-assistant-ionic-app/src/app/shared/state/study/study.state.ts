import {Action, Selector, State, StateContext, Store} from '@ngxs/store';
import {RegisterExerciseResult} from './study.actions';
import {ExerciseService, Experience} from '../../services/exercise/exercise.service';
import {SettingsState} from '../settings/settings.state';
import {Injectable} from '@angular/core';
import {tap} from 'rxjs/operators';

export interface StudyStateModel {
  lastExperience?: Experience;
}

@State<StudyStateModel>({
  name: 'study',
  defaults: {
  }
})
@Injectable()
export class StudyState {
  @Selector()
  public static lastExperience(state: StudyStateModel) {
    return state.lastExperience;
  }

  constructor(
    private exerciseService: ExerciseService,
    private store: Store
  ) {
  }


  @Action(RegisterExerciseResult)
  public registerExerciseResult(ctx: StateContext<StudyStateModel>, {exerciseResult, hydratedExercise}: RegisterExerciseResult) {
    const settings = this.store.selectSnapshot(SettingsState.settings);
    return this.exerciseService.registerExerciseExperience({
      exerciseResult,
      exerciseCorrectStreakCap: settings?.exerciseCorrectStreakCap,
      exerciseId: hydratedExercise.id
    }).pipe(
      tap(experience => {
        ctx.patchState({lastExperience: experience});
      })
    );
  }
}
