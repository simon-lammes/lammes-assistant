import {Component, Input, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomFormsServiceService} from '../../shared/custom-forms-service.service';
import {CreateExerciseResult, Exercise, ExercisesService} from '../exercises.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ReadFile} from 'ngx-file-helpers';

/**
 * Exercises can have different types of fragments, for example: fragments for the assignment and fragments for the solution.
 * Those types are described with this interface.
 */
interface FragmentArrayType {
  title: string;
  fragmentArrayName: string;
  addButtonText: string;
}

/**
 * A control that is only needed if the exercise has a specific type.
 */
interface OptionalControl {

  /**
   * The exercise types for which this control is needed.
   */
  exerciseTypes: string[];
  controlName: string;
  control: FormControl;
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
  readonly allFragmentTypes: FragmentArrayType[] = [
    {
      title: 'Assignment Fragments',
      fragmentArrayName: 'assignmentFragments',
      addButtonText: 'Add assignment fragment'
    },
    {
      title: 'Solution Fragments',
      fragmentArrayName: 'solutionFragments',
      addButtonText: 'Add solution fragment'
    }
  ];
  readonly optionalControls: OptionalControl[] = [
    {
      controlName: 'isStatementCorrect',
      exerciseTypes: ['trueOrFalse'],
      control: this.formBuilder.control(false, [Validators.required])
    }
  ];
  exerciseForm: FormGroup;

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
    const editedHydratedExercise = this.editedExercise ? await this.exercisesService.getHydratedExercise(this.editedExercise) : undefined;
    this.exerciseForm = this.formBuilder.group({
      title: this.formBuilder.control(editedHydratedExercise?.title ?? '', [Validators.required, Validators.min(1)]),
      exerciseType: this.formBuilder.control(editedHydratedExercise?.exerciseType ?? 'standard', [Validators.required]),
      assignmentFragments: this.formBuilder.array(editedHydratedExercise?.assignmentFragments.length > 0
        ? editedHydratedExercise.assignmentFragments.map(x => this.createFragmentFormGroup(x.type, x.value))
        : [this.createFragmentFormGroup()]),
      solutionFragments: this.formBuilder.array(editedHydratedExercise?.solutionFragments.length > 0
        ? editedHydratedExercise.solutionFragments.map(x => this.createFragmentFormGroup(x.type, x.value))
        : [this.createFragmentFormGroup()])
    });
    // Changing the title of an already created exercise would require us to change its key everywhere.
    // As this is complicated, it is not allowed yet.
    if (this.editedExercise) {
      this.exerciseForm.controls.title.disable();
    }
    this.setupOptionalControls();
  }

  /**
   * Can for example get all FormGroups that contain an assignment fragment.
   */
  getFragmentControls(fragmentArrayName: string): FormGroup[] {
    const fragmentsArray = this.exerciseForm.get(fragmentArrayName) as FormArray;
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
      const result = await this.exercisesService.createExercise(this.exerciseForm.value);
      switch (result) {
        case CreateExerciseResult.Success:
          await this.dismissModal();
          break;
        case CreateExerciseResult.Conflict:
          await this.showHint('Please change your title because the current title conflicts with an already existing exercise.');
          break;
      }
    }
  }

  trim(formControlName: string) {
    this.customFormsService.trimAndRemoveNeighboringWhitespaces(this.exerciseForm, formControlName);
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
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
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
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
    return fragmentControls.every(control => control.value.type && control.value.value);
  }

  /**
   * When the user changes the type of a fragment, we want to reset value. Otherwise, we could end up with inconsistent state.
   *
   * @example
   * {type: "file", value: "I am a text, but I should be a file."}
   */
  resetFragmentControlValue(fragmentArrayName: string, fragmentIndex: number) {
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
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
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
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
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
    return fragmentControls.length > 1;
  }

  /**
   * This method makes sure that optional controls are added or removed automatically when the exercist type changes.
   * It should guarantee that at any point in time only the needed optional controls are present.
   */
  private setupOptionalControls() {
    this.exerciseForm.controls.exerciseType.valueChanges.pipe(untilDestroyed(this)).subscribe(exerciseType => {
      this.optionalControls.forEach(optionalControl => {
        const isOptionalControlNeededForExerciseType = optionalControl.exerciseTypes.includes(exerciseType);
        const doesOptionalControlAlreadyExist = !!this.exerciseForm.controls[optionalControl.controlName];
        if (isOptionalControlNeededForExerciseType && !doesOptionalControlAlreadyExist) {
          this.exerciseForm.addControl(optionalControl.controlName, this.formBuilder.control(false, [Validators.required]));
        } else {
          this.exerciseForm.removeControl(optionalControl.controlName);
        }
      });
    });
  }

  private async showHint(message: string) {
    const toast = await this.toastController.create({
      header: message,
      color: 'warning',
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

  isFileSelected(fragmentArrayName: string, fragmentIndex: number): boolean {
    const fragmentControls = this.getFragmentControls(fragmentArrayName);
    const fragmentControl = fragmentControls[fragmentIndex];
    const {type, value} = fragmentControl.value;
    return type === 'file' && value;
  }
}
