import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import _ from 'lodash';
import {ExerciseResult, HydratedExercise, PossibleAnswer} from '../../exercises.service';
import {ExerciseState} from '../../study/study.page';

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
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  usersAnswers: UserAnswer[];
  exerciseResult: ExerciseResult;

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.usersAnswers = _.shuffle(this.exercise.possibleAnswers).map(answer => {
      return {...answer, usersEvaluation: false} as UserAnswer;
    });
  }

  getAnswerColor(answer: UserAnswer) {
    if (!this.exerciseResult) {
      return undefined;
    }
    return answer.correct ? 'success' : 'danger';
  }

  requestNextExercise() {
    this.exerciseStateChanged.emit({
      nextExerciseRequested: true
    });
  }

  switchUsersEvaluation(i: number) {
    this.usersAnswers[i].usersEvaluation = !this.usersAnswers[i].usersEvaluation;
  }

  submit() {
    const success = this.usersAnswers.every(answer => answer.correct === answer.usersEvaluation);
    this.exerciseResult = success ? 'SUCCESS' : 'FAILURE';
    this.exerciseStateChanged.emit({
      exerciseResult: this.exerciseResult,
      nextExerciseRequested: false
    });
  }
}