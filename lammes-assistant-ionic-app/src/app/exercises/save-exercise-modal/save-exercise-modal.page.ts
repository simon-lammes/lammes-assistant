import {Component, Input, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsServiceService} from '../../shared/custom-forms-service.service';
import {Exercise, ExercisesService, ExerciseType, HydratedExercise} from '../exercises.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ReadFile} from 'ngx-file-helpers';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

/**
 * We have the need for an abstraction layer for exercise controls because those behave different from other controls:
 * Some controls are only present for some exercise types. To keep this information about which exercise control is needed
 * for which exercise, we have this model.
 */
interface ExerciseControl {

  /**
   * The exercise types for which this control is needed. Undefined, if this control should be used for every exercise type.
   */
  exerciseTypes?: ExerciseType[];
  type: 'fragmentArray' | 'text' | 'select' | 'checkbox';
  title: string;
  controlName: string;
  /**
   * Only specified for type 'fragmentArray'.
   */
  addButtonText?: string;
  /**
   * Only specified for type 'select'.
   */
  selectOptions?: {
    value: string;
    displayValue: string;
  }[];
  controlBuilder: (exercise?: HydratedExercise) => AbstractControl;
}

/**
 * Responsible for creating and editing of exercises.
 */
@UntilDestroy()
@Component({
  selector: 'app-save-exercise-modal',
  templateUrl: './save-exercise-modal.page.html',
  styleUrls: ['./save-exercise-modal.page.scss'],
})
export class SaveExerciseModalPage implements OnInit {
  readonly ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml'];
  readonly allExerciseControls: ExerciseControl[] = [
    {
      title: 'Title',
      controlName: 'title',
      type: 'text',
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.title ?? '', [Validators.required, Validators.min(1)])
    },
    {
      title: 'Assignment Fragments',
      type: 'fragmentArray',
      controlName: 'assignmentFragments',
      addButtonText: 'Add assignment fragment',
      controlBuilder: exercise => this.formBuilder.array(exercise?.assignmentFragments.length > 0
        ? exercise.assignmentFragments.map(x => this.createFragmentFormGroup(x.type, x.value))
        : [this.createFragmentFormGroup()])
    },
    {
      title: 'Solution Fragments',
      type: 'fragmentArray',
      controlName: 'solutionFragments',
      addButtonText: 'Add solution fragment',
      controlBuilder: exercise => this.formBuilder.array(exercise?.solutionFragments.length > 0
        ? exercise.solutionFragments.map(x => this.createFragmentFormGroup(x.type, x.value))
        : [this.createFragmentFormGroup()])
    },
    {
      title: 'ExerciseType',
      controlName: 'exerciseType',
      type: 'select',
      selectOptions: [
        {value: 'standard', displayValue: 'Standard'},
        {value: 'trueOrFalse', displayValue: 'True or False'}
      ],
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.exerciseType ?? 'standard', [Validators.required])
    },
    {
      title: 'Is statement correct?',
      type: 'checkbox',
      controlName: 'isStatementCorrect',
      exerciseTypes: ['trueOrFalse'],
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.isStatementCorrect ?? false, [Validators.required])
    }
  ];
  exerciseForm: FormGroup;
  selectedSegment: 'edit' | 'preview' = 'edit';
  /**
   * The exercise that is being edited by the user. Undefined if a new exercise is created.
   */
  @Input()
  private editedExercise: Exercise;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private customFormsService: CustomFormsServiceService,
    private exercisesService: ExercisesService,
    private toastController: ToastController
  ) {
  }

  async ngOnInit(): Promise<any> {
    await this.setupForm();
  }

  getControlsOfFormArray(formArrayControlName: string): FormGroup[] {
    const fragmentsArray = this.exerciseForm.get(formArrayControlName) as FormArray;
    return fragmentsArray.controls as FormGroup[];
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  async saveExercise() {
    if (this.editedExercise) {
      await this.exercisesService.updateExercise({
        ...this.editedExercise,
        ...this.exerciseForm.value
      });
      await this.dismissModal();
    } else {
      await this.exercisesService.createExercise(this.exerciseForm.value);
      await Promise.all([
        this.showHint('Exercise created', 'primary', 2000),
        this.dismissModal()
      ]);
    }
  }

  trim(formControl: AbstractControl) {
    this.customFormsService.trimAndRemoveNeighboringWhitespaces(formControl);
  }

  /**
   * Whenever, the user selects a file, this method converts this file to base64 and integrates it into the form's value.
   */
  async onFileChange(event: ReadFile, fragmentArrayName: string, fragmentIndex: number) {
    const type = event.type;
    const fileAsBase64 = event.content;
    // Short circuit when the user did not select any files.
    if (!fileAsBase64) {
      return;
    }
    if (!this.ALLOWED_FILE_TYPES.includes(type)) {
      await this.showHint(`File type ${type} is not supported. If you feel like this file type should be supported, you can create a unique issue in GitHub repository for this project.`);
      return;
    }
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    const fragmentControl = fragmentControls[fragmentIndex];
    fragmentControl.controls.value.patchValue(fileAsBase64);
  }

  addFragment(fragmentArrayName: string) {
    const fragmentsArray = this.exerciseForm.get(fragmentArrayName) as FormArray;
    fragmentsArray.push(this.createFragmentFormGroup());
  }

  /**
   * The idea of fragments is that the user can add as much fragments as he needs. However, adding a fragment only makes sense when all
   * existing fragments are used, or to be precise, filled with values.
   */
  canAddFragment(fragmentArrayName: string) {
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    return fragmentControls.every(control => control.value.type && control.value.value);
  }

  /**
   * When the user changes the type of a fragment, we want to reset value. Otherwise, we could end up with inconsistent state.
   *
   * @example
   * {type: "file", value: "I am a text, but I should be a file."}
   */
  resetFragmentControlValue(fragmentArrayName: string, fragmentIndex: number) {
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    const fragmentControl = fragmentControls[fragmentIndex];
    fragmentControl.controls.value.patchValue('');
  }

  removeFragment(fragmentArrayName: string, fragmentIndex: number) {
    const fragmentArray = this.exerciseForm.get(fragmentArrayName) as FormArray;
    fragmentArray.removeAt(fragmentIndex);
  }

  /**
   * Reacts to the event of the user changing a fragments type.
   */
  onTypeChanged(fragmentArrayName: string, fragmentIndex: number) {
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    const fragmentControl = fragmentControls[fragmentIndex];
    const selectedType = fragmentControl.value.type;
    if (selectedType === 'remove') {
      this.removeFragment(fragmentArrayName, fragmentIndex);
    } else {
      this.resetFragmentControlValue(fragmentArrayName, fragmentIndex);
    }
  }

  /**
   * Removing fragments makes only sense when there multiple of them. If a fragment array had 0 elements,
   * the state of the form would not make sense.
   */
  canRemoveFragment(fragmentArrayName: string) {
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    return fragmentControls.length > 1;
  }

  isFileSelected(fragmentArrayName: string, fragmentIndex: number): boolean {
    const fragmentControls = this.getControlsOfFormArray(fragmentArrayName);
    const fragmentControl = fragmentControls[fragmentIndex];
    const {type, value} = fragmentControl.value;
    return type === 'file' && value;
  }

  onSegmentChange({detail: {value}}: CustomEvent) {
    this.selectedSegment = value;
  }

  /**
   * This method makes sure that exercise controls are added or removed automatically when the exercise type changes.
   * It should guarantee that at any point in time only those controls are present that are needed for the current exercise type.
   */
  private async setupForm() {
    const editedHydratedExercise = this.editedExercise ? await this.exercisesService.getHydratedExercise(this.editedExercise) : undefined;
    this.exerciseForm = this.formBuilder.group({});
    this.exerciseForm.valueChanges.pipe(
      untilDestroyed(this),
      startWith({exerciseType: editedHydratedExercise?.exerciseType ?? 'standard'}),
      map(formValue => formValue.exerciseType as ExerciseType),
      distinctUntilChanged()
    ).subscribe(exerciseType => {
      this.allExerciseControls.forEach(optionalControl => {
        const isOptionalControlNeededForExerciseType = !optionalControl.exerciseTypes
          || optionalControl.exerciseTypes.includes(exerciseType);
        const doesOptionalControlAlreadyExist = !!this.exerciseForm.controls[optionalControl.controlName];
        if (isOptionalControlNeededForExerciseType && !doesOptionalControlAlreadyExist) {
          this.exerciseForm.addControl(optionalControl.controlName, optionalControl.controlBuilder(editedHydratedExercise));
        } else if (!isOptionalControlNeededForExerciseType) {
          this.exerciseForm.removeControl(optionalControl.controlName);
        }
      });
    });
  }

  private async showHint(message: string, color = 'warning', duration?: number) {
    const toast = await this.toastController.create({
      header: message,
      color,
      duration,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      position: 'top'
    });
    await toast.present();
  }

  private createFragmentFormGroup(type?: string, value?: string) {
    return this.formBuilder.group({
      type: this.formBuilder.control(type ?? '', [Validators.required]),
      value: this.formBuilder.control(value ?? '', [Validators.required, Validators.min(1)])
    });
  }
}
