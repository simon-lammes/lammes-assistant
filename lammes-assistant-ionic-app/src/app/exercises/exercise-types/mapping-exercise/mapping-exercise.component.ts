import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
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
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  exerciseResult: ExerciseResult;
  answerForm: FormGroup;
  shuffledSources: {label: string, targets: string[], explanation?: string}[];
  shuffledTargets: {id: string, label: string}[];

  constructor(
    private fb: FormBuilder,
    private customFormsService: CustomFormsService
  ) {
  }

  get sourcesArrayControl() {
    return this.answerForm.controls.sources as FormArray;
  }

  get usersSources() {
    return this.answerForm.controls.sources.value as {label: string, targets: string[]}[];
  }

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.shuffledSources = _.shuffle(this.exercise.sources);
    this.shuffledTargets = _.shuffle(this.exercise.targets);
    this.answerForm = this.fb.group({
      sources: this.fb.array(this.shuffledSources.map(source => {
        return this.fb.group({
          label: source.label,
          // Targets is empty because the user needs to fill it.
          targets: []
        });
      }))
    });
  }

  validateUsersAnswer() {
    const isCorrect = this.isUsersAnswerCorrect();
    this.exerciseResult = isCorrect ? 'SUCCESS' : 'FAILURE';
    this.exerciseResultChanged.emit(this.exerciseResult);
    this.answerForm.disable();
  }

  trim(control: FormControl) {
    this.customFormsService.trim(control);
  }

  private isUsersAnswerCorrect(): boolean {
    const answer = this.answerForm.value;
    const sources = answer.sources as {label: string, targets: string[]}[];
    return sources.every((source, index) => {
      const originalSource = this.shuffledSources[index];
      return _.isEqual(new Set(originalSource.targets), new Set(source.targets));
    });
  }

  determineSourceColor(sourceControl: AbstractControl, index: number) {
    if (!this.exerciseResult) {
      return undefined;
    }
    const source = sourceControl.value;
    const originalSource = this.shuffledSources[index];
    return _.isEqual(new Set(originalSource.targets), new Set(source.targets)) ? undefined : 'danger';
  }
}
