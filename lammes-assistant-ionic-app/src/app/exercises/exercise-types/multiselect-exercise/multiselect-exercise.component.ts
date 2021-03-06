import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import _ from 'lodash';
import {ExerciseResult, HydratedExercise, PossibleAnswer} from '../../../shared/services/exercise/exercise.service';

interface UserAnswer extends PossibleAnswer {
  usersEvaluation: boolean;
}

@Component({
  selector: 'app-multiselect-exercise',
  templateUrl: './multiselect-exercise.component.html',
  styleUrls: ['./multiselect-exercise.component.scss'],
})
export class MultiselectExerciseComponent implements OnChanges {

  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  usersAnswers: UserAnswer[];
  exerciseResult: ExerciseResult;

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.usersAnswers = _.shuffle(this.exercise.possibleAnswers).map(answer => {
      return {...answer, usersEvaluation: false} as UserAnswer;
    });
  }

  getAnswerIconColor(answer: UserAnswer) {
    if (!answer.usersEvaluation && answer.correct) {
      return 'success';
    }
  }

  switchUsersEvaluation(i: number) {
    // If the user has already evaluated his answers, his answers are immutable.
    if (this.exerciseResult) {
      return;
    }
    this.usersAnswers[i].usersEvaluation = !this.usersAnswers[i].usersEvaluation;
  }

  submit() {
    const success = this.usersAnswers.every(answer => answer.correct === answer.usersEvaluation);
    this.exerciseResult = success ? 'SUCCESS' : 'FAILURE';
    this.exerciseResultChanged.emit(this.exerciseResult);
  }

  getAnswerIcon(answer: UserAnswer) {
    if (!this.exerciseResult) {
      return;
    }
    if (answer.correct) {
      return 'checkmark-outline';
    } else if (answer.usersEvaluation) {
      return 'close-outline';
    }
    return;
  }

  determineAnswerColor(i: number): string | undefined {
    const isSelected = this.usersAnswers[i].usersEvaluation;
    const isCorrect = this.usersAnswers[i].correct;
    if (isSelected) {
      if (this.exerciseResult) {
        return isCorrect ? 'success' : 'danger';
      } else {
        return 'medium';
      }
    }
    return undefined;
  }
}
