import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
import {ExerciseState} from '../../study/study.page';
import _ from 'lodash';
import {ItemReorderEventDetail} from '@ionic/core';

@Component({
  selector: 'app-ordering-exercise',
  templateUrl: './ordering-exercise.component.html',
  styleUrls: ['./ordering-exercise.component.scss'],
})
export class OrderingExerciseComponent implements OnChanges {

  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  exerciseResult: ExerciseResult;
  answerOrder: string[];

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.answerOrder = _.shuffle([...this.exercise.orderingItems]);
  }

  onUserReview(result: ExerciseResult) {
    this.exerciseStateChanged.emit({
      exerciseResult: result,
      nextExerciseRequested: true
    });
  }

  submit() {
    const success = _.isEqual(this.exercise.orderingItems, this.answerOrder);
    this.exerciseResult = success ? 'SUCCESS' : 'FAILURE';
    this.exerciseStateChanged.emit({
      exerciseResult: this.exerciseResult,
      nextExerciseRequested: false
    });
  }

  reorderAnswerOrder(event: CustomEvent<ItemReorderEventDetail>) {
    event.detail.complete(this.answerOrder);
  }

  requestNextExercise() {
    this.exerciseStateChanged.emit({
      nextExerciseRequested: true
    });
  }
}
