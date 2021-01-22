import {Component, Input, OnInit} from '@angular/core';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsServiceService} from '../../shared/custom-forms-service.service';
import {Exercise, ExercisesService, ExerciseType, HydratedExercise} from '../exercises.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {ReadFile} from 'ngx-file-helpers';

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
  type: 'textarea' | 'text' | 'select' | 'checkbox' | 'files' | 'possibleAnswers' | 'labelSelector';
  title: string;
  controlName: string;
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
  readonly ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
  readonly allExerciseControls: ExerciseControl[] = [
    {
      title: 'Title',
      controlName: 'title',
      type: 'text',
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.title ?? '', [Validators.required, Validators.min(1)])
    },
    {
      title: 'Assignment',
      type: 'textarea',
      controlName: 'assignment',
      controlBuilder: exercise => this.formBuilder.control(exercise?.assignment ?? '', [Validators.required, Validators.min(1)])
    },
    {
      title: 'Solution',
      type: 'textarea',
      controlName: 'solution',
      controlBuilder: exercise => this.formBuilder.control(exercise?.solution ?? '', [Validators.required, Validators.min(1)])
    },
    {
      title: 'ExerciseType',
      controlName: 'exerciseType',
      type: 'select',
      selectOptions: [
        {value: 'standard', displayValue: 'Standard'},
        {value: 'multiselect', displayValue: 'Multi-select'},
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
    },
    {
      title: 'Possible Answers',
      type: 'possibleAnswers',
      controlName: 'possibleAnswers',
      exerciseTypes: ['multiselect'],
      controlBuilder: (exercise) => {
        const possibleAnswers = exercise?.possibleAnswers ?? [];
        return this.formBuilder.array(possibleAnswers.map((answer) => this.formBuilder.group({
          value: this.formBuilder.control(answer.value),
          correct: this.formBuilder.control(answer.correct)
        })), [Validators.required]);
      }
    },
    {
      title: 'Files',
      type: 'files',
      controlName: 'files',
      controlBuilder: exercise => {
        const files = exercise?.files ?? [];
        return this.formBuilder.array(files.map((file) => this.formBuilder.group({
          name: this.formBuilder.control(file.name),
          value: this.formBuilder.control(file.value)
        })));
      }
    },
    {
      title: 'Labels',
      type: 'labelSelector',
      controlName: 'labels',
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.labels ?? [])
    },
    {
      title: 'Language',
      type: 'select',
      controlName: 'languageCode',
      selectOptions: [
        {value: 'en', displayValue: 'English'},
        {value: 'de', displayValue: 'German'}
      ],
      controlBuilder: (exercise) => this.formBuilder.control(exercise?.languageCode ?? 'en')
    }
  ];
  exerciseForm: FormGroup;
  selectedSegment: 'edit' | 'preview' = 'edit';
  /**
   * The exercise that is being edited by the user. Undefined if a new exercise is created.
   */
  @Input()
  private editedExercise: Exercise;

  /**
   * If an exercise is provided, one must specify whether the user this exercise.
   */
  @Input()
  doesUserOwnEditedExercise = true;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private customFormsService: CustomFormsServiceService,
    private exercisesService: ExercisesService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
  }

  async ngOnInit(): Promise<any> {
    await this.setupForm();
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  getArrayControls(formArrayName: string) {
    const filesArrayControl = this.exerciseForm.controls[formArrayName] as FormArray;
    return filesArrayControl.controls as FormGroup[];
  }

  async saveExercise() {
    if (this.editedExercise && this.doesUserOwnEditedExercise) {
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

  async addFile(file: ReadFile) {
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      await this.showHint('File type not allowed.');
      return;
    }
    const filesArrayControl = this.exerciseForm.controls.files as FormArray;
    const alert = await this.alertController.create({
      header: 'Add File',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Name',
          value: file.name
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (result: { name: string }) => {
            const {name} = result;
            const doesNameAlreadyExist = filesArrayControl.controls.some(control => control.value.name === name);
            if (doesNameAlreadyExist) {
              await this.showHint('You already have a file with this name.');
              return;
            }
            filesArrayControl.push(this.formBuilder.control({
              name,
              value: file.content
            }));
          }
        }
      ]
    });
    await alert.present();
    // I do not know a nicer way of autofocusing the first input element.
    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  async copyFileReferenceToClipboard(file: { name: string, value: string }) {
    const {name} = file;
    await navigator.clipboard.writeText(`![${name}][${name}]`);
    await this.showHint('File reference copied to clipboard.', 'primary', 1500);
  }

  removeFile(index: number) {
    const filesArrayControl = this.exerciseForm.controls.files as FormArray;
    filesArrayControl.removeAt(index);
  }

  addAnswer() {
    const possibleAnswersArrayControl = this.exerciseForm.controls.possibleAnswers as FormArray;
    possibleAnswersArrayControl.push(this.formBuilder.group({
      value: this.formBuilder.control(''),
      correct: this.formBuilder.control(false)
    }));
  }

  removeAnswer(i: number) {
    const possibleAnswersArrayControl = this.exerciseForm.controls.possibleAnswers as FormArray;
    possibleAnswersArrayControl.removeAt(i);
  }
}
