import {Component, Input, OnInit} from '@angular/core';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsService} from '../../shared/services/custom-forms.service';
import {Exercise, ExercisesService, ExerciseType, HydratedExercise, PossibleAnswer} from '../exercises.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {ReadFile} from 'ngx-file-helpers';
import {ApplicationConfigurationService} from '../../shared/services/application-configuration/application-configuration.service';
import {ItemReorderEventDetail} from '@ionic/core';
import {TranslateService} from '@ngx-translate/core';

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
  type: 'textarea' | 'text' | 'select' | 'checkbox' | 'files' | 'possibleAnswers' | 'labelSelector' | 'orderingItems';
  title: Promise<string>;
  controlName: string;
  /**
   * Only specified for type 'select'.
   */
  selectOptions?: {
    value: string;
    displayValue: Promise<string>;
  }[];
  controlBuilder: (exerciseType: ExerciseType, exercise?: Partial<HydratedExercise>) => AbstractControl;
  /**
   * If set to true, the value of this control will not be reset when the user saves the exercise and starts creating the next exercise.
   * This prevents the user from needing to type certain things over and over again.
   */
  isLocked?: boolean;
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
  readonly allExerciseControls: ExerciseControl[] = [
    {
      title: this.translateService.get('title').toPromise(),
      controlName: 'title',
      type: 'text',
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.title ?? '', [Validators.required, Validators.minLength(1)])
    },
    {
      title: this.translateService.get('assignment').toPromise(),
      type: 'textarea',
      controlName: 'assignment',
      controlBuilder: (type, exercise) => this.formBuilder.control(
        exercise?.assignment ?? '',
        [Validators.required, Validators.minLength(1)]
      )
    },
    {
      title: this.translateService.get('solution').toPromise(),
      type: 'textarea',
      controlName: 'solution',
      controlBuilder: (type, exercise) => {
        // In a multiselect exercise, we do not necessarily need a solution text.
        const isSolutionRequired = type !== 'multiselect';
        return this.formBuilder.control(exercise?.solution ?? '', isSolutionRequired ? [Validators.required, Validators.min(1)] : []);
      }
    },
    {
      title: this.translateService.get('exercise-type').toPromise(),
      controlName: 'exerciseType',
      type: 'select',
      isLocked: true,
      selectOptions: [
        {value: 'standard', displayValue: this.translateService.get('exercise-type-list.standard').toPromise()},
        {value: 'multiselect', displayValue: this.translateService.get('exercise-type-list.multi-select').toPromise()},
        {value: 'ordering', displayValue: this.translateService.get('exercise-type-list.ordering').toPromise()},
        {value: 'trueOrFalse', displayValue: this.translateService.get('exercise-type-list.true-or-false').toPromise()}
      ],
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.exerciseType ?? 'standard', [Validators.required])
    },
    {
      title: this.translateService.get('questions.is-statement-correct').toPromise(),
      type: 'checkbox',
      controlName: 'isStatementCorrect',
      exerciseTypes: ['trueOrFalse'],
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.isStatementCorrect ?? false, [Validators.required])
    },
    {
      title: this.translateService.get('possible-answers').toPromise(),
      type: 'possibleAnswers',
      controlName: 'possibleAnswers',
      exerciseTypes: ['multiselect'],
      controlBuilder: (type, exercise) => {
        const defaultAnswer: PossibleAnswer = {correct: false, value: '', explanation: ''};
        const possibleAnswers = exercise?.possibleAnswers ?? [defaultAnswer];
        return this.formBuilder.array(possibleAnswers.map((answer) => this.formBuilder.group({
          value: this.formBuilder.control(answer.value),
          correct: this.formBuilder.control(answer.correct),
          explanation: this.formBuilder.control(answer.explanation)
        })), [Validators.required]);
      }
    },
    {
      title: this.translateService.get('order-items').toPromise(),
      type: 'orderingItems',
      controlName: 'orderingItems',
      exerciseTypes: ['ordering'],
      controlBuilder: (type, exercise) => {
        const orderItems = exercise?.orderingItems ?? [''];
        return this.formBuilder.array(orderItems.map((orderItem) => this.formBuilder.control(
          orderItem,
          [Validators.required, Validators.minLength(1)]
        )));
      }
    },
    {
      title: this.translateService.get('files').toPromise(),
      type: 'files',
      controlName: 'files',
      controlBuilder: (type, exercise) => {
        const files = exercise?.files ?? [];
        return this.formBuilder.array(files.map((file) => this.formBuilder.group({
          name: this.formBuilder.control(file.name),
          value: this.formBuilder.control(file.value)
        })));
      }
    },
    {
      title: this.translateService.get('labels').toPromise(),
      isLocked: true,
      type: 'labelSelector',
      controlName: 'labels',
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.labels ?? [])
    },
    {
      title: this.translateService.get('language').toPromise(),
      isLocked: true,
      type: 'select',
      controlName: 'languageCode',
      selectOptions: [
        {value: 'en', displayValue: this.translateService.get('language-list.english').toPromise()},
        {value: 'de', displayValue: this.translateService.get('language-list.german').toPromise()}
      ],
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.languageCode ?? 'en')
    }
  ];
  exerciseForm: FormGroup;
  selectedSegment: 'edit' | 'preview' = 'edit';
  /**
   * If an exercise is provided, one must specify whether the user this exercise.
   */
  @Input()
  doesUserOwnEditedExercise = true;
  /**
   * The exercise that is being edited by the user. Undefined if a new exercise is created.
   */
  @Input()
  private editedExercise: Exercise;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private customFormsService: CustomFormsService,
    private exercisesService: ExercisesService,
    private toastController: ToastController,
    private alertController: AlertController,
    private applicationConfigurationService: ApplicationConfigurationService,
    private translateService: TranslateService
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
        this.setupForm()
      ]);
    }
  }

  trim(formControl: AbstractControl) {
    this.customFormsService.trimAndRemoveNeighboringWhitespaces(formControl);
  }

  onSegmentChange({detail: {value}}: CustomEvent) {
    this.selectedSegment = value;
  }

  async addFile(file: ReadFile) {
    const {allowedFileTypes} = await this.applicationConfigurationService.getApplicationConfigurationSnapshot();
    if (!allowedFileTypes.includes(file.type)) {
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
      correct: this.formBuilder.control(false),
      explanation: this.formBuilder.control('')
    }));
  }

  removeAnswer(i: number) {
    const possibleAnswersArrayControl = this.exerciseForm.controls.possibleAnswers as FormArray;
    possibleAnswersArrayControl.removeAt(i);
  }

  addOrderingItem() {
    const orderingItemsArrayControl = this.exerciseForm.controls.orderingItems as FormArray;
    orderingItemsArrayControl.push(this.formBuilder.control(''));
  }

  /**
   * Refactor once this [pr](https://github.com/angular/angular/issues/27171) is closed.
   */
  reorderOrderingItems(event: CustomEvent<ItemReorderEventDetail>) {
    // I copied this source code from https://github.com/angular/angular/issues/27171
    // without understanding it because I am sure that it works in this use case.
    const from = event.detail.from;
    const to = event.detail.to;
    const dir = to > from ? 1 : -1;
    const orderingItemsArrayControl = this.exerciseForm.controls.orderingItems as FormArray;
    const temp = orderingItemsArrayControl.at(from);
    for (let i = from; i * dir < to * dir; i = i + dir) {
      const current = orderingItemsArrayControl.at(i + dir);
      orderingItemsArrayControl.setControl(i, current);
    }
    orderingItemsArrayControl.setControl(to, temp);
    // Finish the reorder and position the item in the DOM based on where the gesture ended.
    event.detail.complete();
  }

  /**
   * This method makes sure that exercise controls are added or removed automatically when the exercise type changes.
   * It should guarantee that at any point in time only those controls are present that are needed for the current exercise type.
   * It be called in order to 'reset' the form.
   */
  private async setupForm() {
    const currentValue = this.editedExercise
      ? await this.exercisesService.getHydratedExercise(this.editedExercise)
      : this.getExerciseLockedValues();
    this.exerciseForm = this.formBuilder.group({});
    this.exerciseForm.valueChanges.pipe(
      untilDestroyed(this),
      startWith({exerciseType: currentValue?.exerciseType ?? 'standard'}),
      map(formValue => formValue.exerciseType as ExerciseType),
      distinctUntilChanged()
    ).subscribe(exerciseType => {
      this.allExerciseControls.forEach(optionalControl => {
        const isOptionalControlNeededForExerciseType = !optionalControl.exerciseTypes
          || optionalControl.exerciseTypes.includes(exerciseType);
        const doesOptionalControlAlreadyExist = !!this.exerciseForm.controls[optionalControl.controlName];
        if (isOptionalControlNeededForExerciseType && !doesOptionalControlAlreadyExist) {
          this.exerciseForm.addControl(optionalControl.controlName, optionalControl.controlBuilder(exerciseType, currentValue));
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

  /**
   * When the user saves an exercise and starts on creating the next exercise, there are some values that he/she does not
   * want to enter again. This method does extract exactly those values.
   */
  private getExerciseLockedValues(): Partial<HydratedExercise> | undefined {
    if (!this.exerciseForm?.value) {
      return;
    }
    const lockedControls = this.allExerciseControls.filter(x => x.isLocked);
    return lockedControls.map(control => {
      const key = control.controlName;
      const value = this.exerciseForm.value[key];
      return {[key]: value};
    }).reduce((previousValue, currentValue) => ({...previousValue, ...currentValue}));
  }
}
