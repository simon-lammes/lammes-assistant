import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
import {ExerciseState} from '../../study/study.page';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {CustomFormsService} from '../../../shared/services/custom-forms.service';
import _ from 'lodash';

@Component({
  selector: 'app-mapping-exercise',
  templateUrl: './mapping-exercise.component.html',
  styleUrls: ['./mapping-exercise.component.scss'],
})
export class MappingExerciseComponent implements OnChanges {
  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  exerciseResult: ExerciseResult;
  answerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private customFormsService: CustomFormsService
  ) {
  }

  get sourcesArrayControl() {
    return this.answerForm.controls.sources as FormArray;
  }

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.answerForm = this.fb.group({
      sources: this.fb.array(this.exercise.sources.map(source => {
        return this.fb.group({
          label: source.label,
          // Targets is empty because the user needs to fill it.
          targets: []
        });
      }))
    });
  }

  requestNextExercise() {
    this.exerciseStateChanged.emit({
      nextExerciseRequested: true
    });
  }

  validateUsersAnswer() {
    const isCorrect = this.isUsersAnswerCorrect();
    this.exerciseResult = isCorrect ? 'SUCCESS' : 'FAILURE';
    this.exerciseStateChanged.emit({
      exerciseResult: this.exerciseResult,
      nextExerciseRequested: false
    });
    this.answerForm.disable();
  }

  trim(control: FormControl) {
    this.customFormsService.trim(control);
  }

  private isUsersAnswerCorrect(): boolean {
    const answer = this.answerForm.value;
    const sources = answer.sources as {label: string, targets: string[]}[];
    return sources.every((source, index) => {
      const originalSource = this.exercise.sources[index];
      return _.isEqual(new Set(originalSource.targets), new Set(source.targets));
    });
  }

  getTargetById(targetId: string) {
    return this.exercise.targets.find(target => target.id === targetId);
  }
}
