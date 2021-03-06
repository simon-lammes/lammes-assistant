import {Component, Input, OnInit} from '@angular/core';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomFormsService} from '../../shared/services/custom-forms.service';
import {
  Exercise,
  ExerciseService,
  ExerciseType,
  HydratedExercise,
  LanguageCodeIso639_1,
  PossibleAnswer
} from '../../shared/services/exercise/exercise.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChanged, filter, map, pairwise, shareReplay, startWith} from 'rxjs/operators';
import {ReadFile} from 'ngx-file-helpers';
import {ApplicationConfigurationService} from '../../shared/services/application-configuration/application-configuration.service';
import {ItemReorderEventDetail} from '@ionic/core';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {v4 as uuidv4} from 'uuid';
import {Actions, ofActionDispatched, Store} from '@ngxs/store';
import {
  ExerciseCreationFailureReason,
  ExerciseSaved,
  ExerciseSavingFailed,
  SaveExercise
} from '../../shared/state/exercise/exercise.actions';

/**
 * This value represents that the language of the exercise should be automatically detected.
 * It is necessary because the value null sadly does not work properly.
 * Please replace this value with null once it properly works with Angular Reactive Forms.
 */
const detectLanguageAutomaticallyKey = 'automatic';

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
  type: 'textarea' | 'text' | 'select' | 'checkbox' | 'files' | 'possibleAnswers' | 'labelSelector' | 'orderingItems' | 'promptSolutions' | 'groupSelect' | 'nodes' | 'edges' | 'targets' | 'sources';
  title: Promise<string>;
  controlName: string;
  /**
   * Only specified for type 'select'.
   */
  selectOptions?: {
    value: string;
    displayValue: Promise<string>;
  }[];
  /**
   * Specifies how this exercise control is build.
   */
  controlBuilder: (exerciseType: ExerciseType, exercise?: Partial<HydratedExercise>) => AbstractControl;
  /**
   * If set to true, the value of this control will not be reset when the user saves the exercise and starts creating the next exercise.
   * This prevents the user from needing to type certain things over and over again.
   */
  isLocked?: boolean;
  /**
   * This method adds a child control to this control. Useful for FormArrays.
   * @param thisControl A reference to the control that is specified by this object.
   */
  addChildControl?: (args?: any) => void;
  /**
   * This method removes a child control from this control. Useful for FormArrays.
   * @param thisControl A reference to the control that is specified by this object.
   * @param index the index of the child item that is removed
   */
  removeChildControl?: (index: number) => void;
  /**
   * Determine whether this control should be rebuilt because something that influences this control potentially changed.
   */
  needsToBeRebuilt?: (previousValue?: ExerciseType, newValue?: ExerciseType) => boolean;
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
  exerciseForm: FormGroup;
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
      needsToBeRebuilt: (previousValue, newValue) => {
        return previousValue !== newValue;
      },
      controlBuilder: (type, exercise) => {
        // For some types of exercises, we do not necessarily need a solution text.
        const exerciseTypesThatDontRequireSolution: ExerciseType[] = ['multiselect', 'prompt', 'mapping'];
        const isSolutionRequired = !exerciseTypesThatDontRequireSolution.includes(type);
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
        {value: 'trueOrFalse', displayValue: this.translateService.get('exercise-type-list.true-or-false').toPromise()},
        {value: 'prompt', displayValue: this.translateService.get('exercise-type-list.prompt').toPromise()},
        {value: 'directedGraphAssembly', displayValue: this.translateService.get('exercise-type-list.directed-graph-assembly').toPromise()},
        {value: 'mapping', displayValue: this.translateService.get('exercise-type-list.mapping').toPromise()}
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
      // Sometimes you are making quiz exercises where all of the questions have
      // the same answer possibilities. Therefore, this lock is very convenient in some cases.
      isLocked: true,
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
      },
      addChildControl: () => {
        const possibleAnswersArrayControl = this.exerciseForm.controls.possibleAnswers as FormArray;
        possibleAnswersArrayControl.push(this.formBuilder.group({
          value: this.formBuilder.control(''),
          correct: this.formBuilder.control(false),
          explanation: this.formBuilder.control('')
        }));
      },
      removeChildControl: index => {
        const possibleAnswersArrayControl = this.exerciseForm.controls.possibleAnswers as FormArray;
        possibleAnswersArrayControl.removeAt(index);
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
      },
      addChildControl: () => {
        const orderingItemsArrayControl = this.exerciseForm.controls.orderingItems as FormArray;
        orderingItemsArrayControl.push(this.formBuilder.control(''));
      }
    },
    {
      title: this.translateService.get('prompt-solutions').toPromise(),
      type: 'promptSolutions',
      controlName: 'promptSolutions',
      exerciseTypes: ['prompt'],
      controlBuilder: (type, exercise) => {
        const promptSolutions = exercise?.promptSolutions ?? [{value: ''}];
        return this.formBuilder.array(promptSolutions.map((promptSolution) => {
          return this.formBuilder.group({
            value: this.formBuilder.control(
              promptSolution.value,
              [Validators.required, Validators.minLength(1)]
            )
          });
        }));
      },
      addChildControl: () => {
        const control = this.exerciseForm.controls.promptSolutions as FormArray;
        const newPromptSolution = this.formBuilder.group({
          value: this.formBuilder.control(
            '',
            [Validators.required, Validators.minLength(1)]
          )
        });
        control.push(newPromptSolution);
      },
      removeChildControl: (index: number) => {
        const control = this.exerciseForm.controls.promptSolutions as FormArray;
        control.removeAt(index);
      }
    },
    {
      title: this.translateService.get('nodes').toPromise(),
      type: 'nodes',
      isLocked: false,
      controlName: 'nodes',
      exerciseTypes: ['directedGraphAssembly'],
      controlBuilder: (type, exercise) => {
        const nodes = exercise?.nodes ?? [{id: uuidv4(), label: ''}];
        return this.formBuilder.array(nodes.map((node) => {
          return this.formBuilder.group({
            id: this.formBuilder.control(node.id),
            label: this.formBuilder.control(
              node.label,
              [Validators.required, Validators.minLength(1)]
            )
          });
        }));
      },
      addChildControl: () => {
        const control = this.exerciseForm.controls.nodes as FormArray;
        const newNode = this.formBuilder.group({
          id: uuidv4(),
          label: this.formBuilder.control(
            '',
            [Validators.required, Validators.minLength(1)]
          )
        });
        control.push(newNode);
      },
      removeChildControl: (index: number) => {
        const control = this.exerciseForm.controls.nodes as FormArray;
        const uuid = control.at(index).value.id;
        control.removeAt(index);
        // Now remove all references to the deleted node.
        const edgesControl = this.exerciseForm.controls.edges as FormArray;
        for (const edgeControl of edgesControl.controls) {
          if (edgeControl.value.source === uuid) {
            edgeControl.patchValue({source: null});
          }
          if (edgeControl.value.target === uuid) {
            edgeControl.patchValue({target: null});
          }
        }
      }
    },
    {
      title: this.translateService.get('edges').toPromise(),
      type: 'edges',
      isLocked: false,
      controlName: 'edges',
      exerciseTypes: ['directedGraphAssembly'],
      controlBuilder: (type, exercise) => {
        const edges = exercise?.edges ?? [];
        return this.formBuilder.array(edges.map((edge) => {
          return this.formBuilder.group({
            id: this.formBuilder.control(edge.id),
            label: this.formBuilder.control(
              edge.label,
              [Validators.required, Validators.minLength(1)]
            ),
            source: this.formBuilder.control(edge.source),
            target: this.formBuilder.control(edge.target)
          });
        }));
      },
      addChildControl: () => {
        const control = this.exerciseForm.controls.edges as FormArray;
        const newEdge = this.formBuilder.group({
          id: uuidv4(),
          label: this.formBuilder.control(
            '',
            [Validators.required, Validators.minLength(1)]
          ),
          source: this.formBuilder.control(null),
          target: this.formBuilder.control(null)
        });
        control.push(newEdge);
      },
      removeChildControl: (index: number) => {
        const control = this.exerciseForm.controls.edges as FormArray;
        control.removeAt(index);
      }
    },
    {
      title: this.translateService.get('targets').toPromise(),
      type: 'targets',
      isLocked: false,
      controlName: 'targets',
      exerciseTypes: ['mapping'],
      controlBuilder: (type, exercise) => {
        const nodes = exercise?.targets ?? [{id: uuidv4(), label: ''}];
        return this.formBuilder.array(nodes.map((node) => {
          return this.formBuilder.group({
            id: this.formBuilder.control(node.id),
            label: this.formBuilder.control(
              node.label,
              [Validators.required, Validators.minLength(1)]
            )
          });
        }));
      },
      addChildControl: () => {
        const control = this.exerciseForm.controls.targets as FormArray;
        const newNode = this.formBuilder.group({
          id: uuidv4(),
          label: this.formBuilder.control(
            '',
            [Validators.required, Validators.minLength(1)]
          )
        });
        control.push(newNode);
      },
      removeChildControl: (index: number) => {
        const control = this.exerciseForm.controls.targets as FormArray;
        const uuid = control.at(index).value.id;
        control.removeAt(index);
        // Now remove all references to the deleted node.
        const sourcesControl = this.exerciseForm.controls.sources as FormArray;
        for (const sourceControl of sourcesControl.controls) {
          if (sourceControl.value.targets.includes(uuid)) {
            sourceControl.patchValue(sourceControl.value.targets.filter(uuid));
          }
        }
      }
    },
    {
      title: this.translateService.get('sources').toPromise(),
      type: 'sources',
      isLocked: false,
      controlName: 'sources',
      exerciseTypes: ['mapping'],
      controlBuilder: (type, exercise) => {
        const sources = exercise?.sources ?? [];
        return this.formBuilder.array(sources.map((source) => {
          return this.formBuilder.group({
            label: this.formBuilder.control(
              source.label,
              [Validators.required, Validators.minLength(1)]
            ),
            targets: this.formBuilder.control(source.targets),
            explanation: this.formBuilder.control(source.explanation)
          });
        }));
      },
      addChildControl: () => {
        const control = this.exerciseForm.controls.sources as FormArray;
        const newNode = this.formBuilder.group({
          label: this.formBuilder.control(
            '',
            [Validators.required, Validators.minLength(1)]
          ),
          targets: this.formBuilder.control([]),
          explanation: this.formBuilder.control('')
        });
        control.push(newNode);
      },
      removeChildControl: (index: number) => {
        const control = this.exerciseForm.controls.sources as FormArray;
        control.removeAt(index);
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
      },
      addChildControl: async (file: ReadFile) => {
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
      },
      removeChildControl: index => {
        const filesArrayControl = this.exerciseForm.controls.files as FormArray;
        filesArrayControl.removeAt(index);
      }
    },
    {
      title: this.translateService.get('groups').toPromise(),
      isLocked: true,
      type: 'groupSelect',
      controlName: 'groupIds',
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.groupIds ?? [])
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
        {value: detectLanguageAutomaticallyKey, displayValue: this.translateService.get('detect-automatically').toPromise()},
        {value: 'en', displayValue: this.translateService.get('language-list.english').toPromise()},
        {value: 'de', displayValue: this.translateService.get('language-list.german').toPromise()}
      ],
      controlBuilder: (type, exercise) => this.formBuilder.control(exercise?.languageCode || detectLanguageAutomaticallyKey)
    }
  ];
  selectedSegment: 'edit' | 'preview' = 'edit';
  nextExerciseRequestedSubject = new BehaviorSubject<boolean>(true);
  nextExerciseRequested$: Observable<boolean>;
  /**
   * The exercise that will be shown in the preview view.
   */
  previewedExercise$: Observable<HydratedExercise>;
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
    private exerciseService: ExerciseService,
    private toastController: ToastController,
    private alertController: AlertController,
    private applicationConfigurationService: ApplicationConfigurationService,
    private translateService: TranslateService,
    private store: Store,
    private actions: Actions
  ) {
  }

  async ngOnInit(): Promise<any> {
    await this.setupForm();
    await this.setupPreview();
    await this.setupAutomaticToasts();
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  getArrayControls(formArrayName: string) {
    const filesArrayControl = this.exerciseForm.controls[formArrayName] as FormArray;
    return filesArrayControl.controls as FormGroup[] | FormControl[];
  }

  async saveExercise() {
    const exercise = {...this.exerciseForm.value};
    if (exercise.languageCode === detectLanguageAutomaticallyKey) {
      exercise.languageCode = null;
    }
    if (this.editedExercise && this.doesUserOwnEditedExercise) {
      this.store.dispatch(new SaveExercise(exercise, this.editedExercise.id));
    } else {
      this.store.dispatch(new SaveExercise(exercise, null));
    }
  }

  trim(formControl: AbstractControl, removeUnnecessaryWhitespacesInBetween: boolean = true) {
    if (removeUnnecessaryWhitespacesInBetween) {
      this.customFormsService.trimAndRemoveNeighboringWhitespaces(formControl);
    } else {
      this.customFormsService.trim(formControl);
    }
  }

  onSegmentChange({detail: {value}}: CustomEvent) {
    this.selectedSegment = value;
  }

  async copyFileReferenceToClipboard(file: { name: string, value: string }) {
    const {name} = file;
    await navigator.clipboard.writeText(`![${name}][${name}]`);
    await this.showHint('File reference copied to clipboard.', 'primary', 1500);
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
    const currentValue: Partial<HydratedExercise> | undefined = this.editedExercise
      ? await this.exerciseService.getHydratedExercise(this.editedExercise)
      : this.getExerciseLockedValues();
    this.exerciseForm = this.formBuilder.group({});
    this.exerciseForm.valueChanges.pipe(
      untilDestroyed(this),
      startWith(null, {exerciseType: currentValue?.exerciseType ?? 'standard'}),
      map(formValue => formValue?.exerciseType as ExerciseType),
      distinctUntilChanged(),
      pairwise()
    ).subscribe(([previous, exerciseType]) => {
      this.allExerciseControls.forEach(optionalControl => {
        const isOptionalControlNeededForExerciseType = !optionalControl.exerciseTypes
          || optionalControl.exerciseTypes.includes(exerciseType);
        const doesOptionalControlAlreadyExist = !!this.exerciseForm.controls[optionalControl.controlName];

        // Add missing control, remove unwanted control or rebuild control
        if (isOptionalControlNeededForExerciseType && !doesOptionalControlAlreadyExist) {
          this.exerciseForm.addControl(optionalControl.controlName, optionalControl.controlBuilder(exerciseType, currentValue));
        } else if (!isOptionalControlNeededForExerciseType) {
          this.exerciseForm.removeControl(optionalControl.controlName);
        } else if (optionalControl.needsToBeRebuilt && optionalControl.needsToBeRebuilt(previous, exerciseType)) {
          this.exerciseForm.removeControl(optionalControl.controlName);
          this.exerciseForm.addControl(optionalControl.controlName, optionalControl.controlBuilder(exerciseType, currentValue));
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

  /**
   * Makes sure that the exercise preview works.
   */
  private async setupPreview() {
    this.nextExerciseRequested$ = this.nextExerciseRequestedSubject.asObservable();
    this.previewedExercise$ = combineLatest([
      this.exerciseForm.valueChanges.pipe(startWith(this.exerciseForm.value as HydratedExercise)),
      this.nextExerciseRequested$
    ]).pipe(
      // The trick is to make a deep copy. This will trigger Angular's change
      // which will 'restart' the exercise' which is what we expect when next
      // exercise is requested.
      map(([exercise]) => ({...exercise})),
      shareReplay(1)
    );
  }

  private resetForm() {
    const value = this.getExerciseLockedValues();
    this.exerciseForm.reset(value);
  }

  onNextExerciseRequested() {
    this.nextExerciseRequestedSubject.next(true);
  }

  private async setupAutomaticToasts() {
    this.actions.pipe(
      untilDestroyed(this),
      ofActionDispatched(ExerciseSaved)
    ).subscribe(async ({editedExerciseId}: ExerciseSaved) => {
      if (editedExerciseId) {
        await Promise.all([
          this.showHint(await this.translateService.get('messages.exercise-updated').toPromise(), 'primary', 2000),
          this.dismissModal()
        ]);
      } else {
        await Promise.all([
          this.showHint(await this.translateService.get('messages.exercise-created').toPromise(), 'primary', 2000),
          this.resetForm()
        ]);
      }
    });
    this.actions.pipe(
      untilDestroyed(this),
      ofActionDispatched(ExerciseSavingFailed),
      filter((failure: ExerciseSavingFailed) => failure.reason === ExerciseCreationFailureReason.LanguageUndetermined)
    ).subscribe(async ({exercise, editedExerciseId}) => {
      const alert = await this.alertController.create({
        header: await this.translateService.get('messages.language-undetermined').toPromise(),
        message: await this.translateService.get('questions.determine-language').toPromise(),
        inputs: [
          {
            label: await this.translateService.get('language-list.english').toPromise(),
            type: 'radio',
            value: 'en'
          },
          {
            label: await this.translateService.get('language-list.german').toPromise(),
            type: 'radio',
            value: 'de'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: await this.translateService.get('save').toPromise(),
            handler: async (languageCode: LanguageCodeIso639_1) => {
              this.store.dispatch(new SaveExercise({...exercise, languageCode}, editedExerciseId));
            }
          }
        ]
      });
      await alert.present();
    });
  }
}
