import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {HydratedExercise} from '../../shared/services/exercise/exercise.service';
import {ExerciseState} from '../study/study.page';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../shared/state/settings/settings.state';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-exercise-container',
  templateUrl: './exercise-container.component.html',
  styleUrls: ['./exercise-container.component.scss'],
})
export class ExerciseContainerComponent {
  @Select(SettingsState.applicationVolume) applicationVolume$: Observable<number>;

  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  @ViewChild('successAudio') successAudioRef: ElementRef;
  @ViewChild('failureAudio') failureAudioRef: ElementRef;

  onExerciseStateChanged(exercise: HydratedExercise, exerciseState: ExerciseState) {
    if (exerciseState.exerciseResult) {
      exerciseState.exerciseResult === 'SUCCESS'
        ? this.successAudioRef?.nativeElement?.play()
        : this.failureAudioRef?.nativeElement?.play();
    }
    this.exerciseStateChanged.emit(exerciseState);
  }
}
