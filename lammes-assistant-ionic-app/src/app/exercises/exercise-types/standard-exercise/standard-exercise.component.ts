import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';

@Component({
  selector: 'app-standard-exercise',
  templateUrl: './standard-exercise.component.html',
  styleUrls: ['./standard-exercise.component.scss'],
})
export class StandardExerciseComponent implements OnChanges {
  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  isSolutionVisible = false;
  exerciseResult: ExerciseResult;

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.isSolutionVisible = false;
    this.exerciseResult = undefined;
  }

  showSolution() {
    this.isSolutionVisible = true;
  }

  onUserReview(result: ExerciseResult) {
    this.exerciseResult = result;
    this.exerciseResultChanged.emit(result);
  }
}
