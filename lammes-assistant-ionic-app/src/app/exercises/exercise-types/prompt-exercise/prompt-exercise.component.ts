import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../exercises.service';
import {ExerciseState} from '../../study/study.page';
import {FormBuilder, FormControl} from '@angular/forms';
import {CustomFormsService} from '../../../shared/services/custom-forms.service';

@Component({
  selector: 'app-prompt-exercise',
  templateUrl: './prompt-exercise.component.html',
  styleUrls: ['./prompt-exercise.component.scss'],
})
export class PromptExerciseComponent implements OnChanges {

  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  exerciseResult: ExerciseResult;
  usersAnswerControl: FormControl;

  constructor(
    private fb: FormBuilder,
    private customFormsService: CustomFormsService
  ) {
  }

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.usersAnswerControl = this.fb.control('');
  }

  requestNextExercise() {
    this.exerciseStateChanged.emit({
      nextExerciseRequested: true
    });
  }

  validateUsersAnswer() {
    const answer: string = this.usersAnswerControl.value;
    const isCorrect = this.exercise.promptSolutions.some(solution => {
      return solution.value.toLowerCase() === answer.toLowerCase();
    });
    this.exerciseResult = isCorrect ? 'SUCCESS' : 'FAILURE';
    this.exerciseStateChanged.emit({
      exerciseResult: this.exerciseResult,
      nextExerciseRequested: false
    });
  }

  trim(control: FormControl) {
    this.customFormsService.trim(control);
  }
}
