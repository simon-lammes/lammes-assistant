import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
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
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  exerciseResult: ExerciseResult;
  answerOrder: string[];

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.answerOrder = _.shuffle([...this.exercise.orderingItems]);
  }

  onUserReview(result: ExerciseResult) {
    this.exerciseResultChanged.emit(result);
  }

  submit() {
    const success = _.isEqual(this.exercise.orderingItems, this.answerOrder);
    this.exerciseResult = success ? 'SUCCESS' : 'FAILURE';
    this.exerciseResultChanged.emit(this.exerciseResult);
  }

  reorderAnswerOrder(event: CustomEvent<ItemReorderEventDetail>) {
    event.detail.complete(this.answerOrder);
  }
}
