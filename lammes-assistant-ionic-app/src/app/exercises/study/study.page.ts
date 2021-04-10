import {Component, OnInit, ViewChild} from '@angular/core';
import {
  Exercise,
  ExerciseFilterDefinition,
  ExerciseResult,
  ExerciseService,
  HydratedExercise
} from '../../shared/services/exercise/exercise.service';
import {switchMap} from 'rxjs/operators';
import {IonContent, PopoverController, ToastController} from '@ionic/angular';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {StudyPopoverComponent, StudyPopoverResult} from './study-popover/study-popover.component';
import {ActivatedRoute} from '@angular/router';
import {ExerciseCooldown, Settings} from '../../shared/services/settings/settings.service';
import {TranslateService} from '@ngx-translate/core';
import {Select, Store} from '@ngxs/store';
import {SettingsState} from '../../shared/state/settings/settings.state';
import {RegisterExerciseResult} from '../../shared/state/study/study.actions';


@Component({
  selector: 'app-study',
  templateUrl: './study.page.html',
  styleUrls: ['./study.page.scss'],
})
export class StudyPage implements OnInit {
  @Select(SettingsState.settings) settings$: Observable<Settings>;
  @Select(SettingsState.exerciseCooldown) exerciseCooldown$: Observable<ExerciseCooldown>;

  @ViewChild(IonContent) ionContent: IonContent;
  studyProgress$ = this.exerciseService.studyProgress$;
  exerciseFilter$: Observable<ExerciseFilterDefinition>;
  exercise$: Observable<Exercise>;
  hydratedExercise$: Observable<HydratedExercise>;
  private nextExerciseRequestedBehaviourSubject = new BehaviorSubject(true);
  nextExerciseRequested$ = this.nextExerciseRequestedBehaviourSubject.asObservable();

  constructor(
    private exerciseService: ExerciseService,
    private toastController: ToastController,
    private popoverController: PopoverController,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private store: Store
  ) {
  }

  ngOnInit(): void {
    this.exerciseFilter$ = this.exerciseService.extractExerciseFilterDefinitionFromQueryParamMap(this.activatedRoute);
    this.exercise$ = combineLatest([
      this.nextExerciseRequested$,
      this.exerciseCooldown$,
      this.exerciseFilter$
    ]).pipe(
      switchMap(([, exerciseCooldown, exerciseFilter]) => {
        return this.exerciseService.getNextExercise(exerciseCooldown, exerciseFilter);
      })
    );
    this.hydratedExercise$ = this.exercise$.pipe(
      switchMap(exercise => this.exerciseService.getHydratedExercise(exercise))
    );
  }

  async onExerciseResult(exercise: HydratedExercise, exerciseResult: ExerciseResult) {
    this.store.dispatch(new RegisterExerciseResult(exercise, exerciseResult));
    // Scrolling needs to happen after change detection. Therefore, we use setTimeout.
    const scrollPromise = new Promise((resolve) => {
      setTimeout(() => {
        this.ionContent.scrollToBottom(600).then(() => resolve(undefined));
      }, 0);
    });
    await scrollPromise;
  }

  async onNextExerciseRequested() {
    await this.requestNextExercise();
  }

  async showPopover(event: MouseEvent, exercise: Exercise) {
    const popover = await this.popoverController.create({
      component: StudyPopoverComponent,
      componentProps: {
        exercise
      },
      event,
      translucent: true
    });
    await popover.present();
    const eventDetail = await popover.onDidDismiss();
    const result = eventDetail.data as StudyPopoverResult;
    if (result?.gotExperienceSuspended) {
      await this.requestNextExercise();
    }
  }

  private async requestNextExercise() {
    this.nextExerciseRequestedBehaviourSubject.next(true);
    await this.ionContent.scrollToTop(600);
  }
}
