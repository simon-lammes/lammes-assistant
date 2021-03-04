import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../shared/services/exercise/exercise.service';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../shared/state/settings/settings.state';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-exercise-container',
  templateUrl: './exercise-container.component.html',
  styleUrls: ['./exercise-container.component.scss'],
})
export class ExerciseContainerComponent implements OnChanges {
  @Select(SettingsState.applicationVolume) applicationVolume$: Observable<number>;
  @Input()
  exercise: HydratedExercise;
  @Output()
  nextExerciseRequested = new EventEmitter<boolean>();
  @Output()
  exerciseResultChanged = new EventEmitter<ExerciseResult>();
  exerciseResult: ExerciseResult;
  @ViewChild('successAudio') successAudioRef: ElementRef;
  @ViewChild('failureAudio') failureAudioRef: ElementRef;

  ngOnChanges(changes: SimpleChanges): void {
    this.exerciseResult = undefined;
  }

  onNextExerciseRequested() {
    this.nextExerciseRequested.emit(true);
  }

  onExerciseResultChanged(exerciseResult: ExerciseResult) {
    this.exerciseResult = exerciseResult;
    exerciseResult === 'SUCCESS'
      ? this.successAudioRef?.nativeElement?.play()
      : this.failureAudioRef?.nativeElement?.play();
    this.exerciseResultChanged.emit(exerciseResult);
  }
}
