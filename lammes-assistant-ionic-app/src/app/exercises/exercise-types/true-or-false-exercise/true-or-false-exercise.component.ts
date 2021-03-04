import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';

@Component({
  selector: 'app-true-or-false-exercise',
  templateUrl: './true-or-false-exercise.component.html',
  styleUrls: ['./true-or-false-exercise.component.scss'],
})
export class TrueOrFalseExerciseComponent implements OnChanges {

  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  trueOrFalseSelection: boolean;

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.trueOrFalseSelection = undefined;
  }

  getRightOrWrongButtonColor(isRightButton: boolean) {
    if (this.trueOrFalseSelection === isRightButton) {
      const isCorrect = this.trueOrFalseSelection === this.exercise.isStatementCorrect;
      return isCorrect ? 'success' : 'danger';
    }
    return 'medium';
  }

  /**
   * @param evaluation Whether the user said that he thinks the statement is right.
   */
  onEvaluatedStatement(evaluation: boolean) {
    this.trueOrFalseSelection = evaluation;
    const isCorrect = evaluation === this.exercise.isStatementCorrect;
    this.exerciseResultChanged.emit(isCorrect ? 'SUCCESS' : 'FAILURE');
  }
}
