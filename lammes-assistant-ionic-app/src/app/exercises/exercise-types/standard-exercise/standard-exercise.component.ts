import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
import {ExerciseState} from '../../study/study.page';

@Component({
  selector: 'app-standard-exercise',
  templateUrl: './standard-exercise.component.html',
  styleUrls: ['./standard-exercise.component.scss'],
})
export class StandardExerciseComponent implements OnChanges {
  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  isSolutionVisible = false;

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.isSolutionVisible = false;
  }

  showSolution() {
    this.isSolutionVisible = true;
  }

  onUserReview(result: ExerciseResult) {
    this.exerciseStateChanged.emit({
      exerciseResult: result,
      nextExerciseRequested: true
    });
  }
}
