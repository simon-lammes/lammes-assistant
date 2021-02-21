import {Component, OnInit, ViewChild} from '@angular/core';
import {
  Exercise,
  ExerciseFilterDefinition,
  ExerciseResult,
  ExerciseService,
  HydratedExercise
} from '../../shared/services/exercise/exercise.service';
import {first, switchMap} from 'rxjs/operators';
import {IonContent, PopoverController, ToastController} from '@ionic/angular';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {StudyPopoverComponent, StudyPopoverResult} from './study-popover/study-popover.component';
import {ActivatedRoute} from '@angular/router';
import {ExerciseCooldown, Settings} from '../../shared/services/settings/settings.service';
import {TranslateService} from '@ngx-translate/core';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../shared/state/settings/settings.state';

export interface ExerciseState {
  exerciseResult?: ExerciseResult;
  nextExerciseRequested?: boolean;
}

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
    private translateService: TranslateService
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

  async onExerciseStateChanged(exercise: HydratedExercise, {exerciseResult, nextExerciseRequested}: ExerciseState) {
    if (exerciseResult) {
      const toastPromise = this.showToastForExerciseResult(exerciseResult);
      const registerPromise = this.registerExerciseResult(exercise.id, exerciseResult);
      // Scrolling needs to happen after change detection. Therefore, we use setTimeout.
      const scrollPromise = new Promise((resolve) => {
        setTimeout(() => {
          this.ionContent.scrollToBottom(600).then(() => resolve());
        }, 0);
      });
      await Promise.all([toastPromise, registerPromise, scrollPromise]);
    }
    if (nextExerciseRequested) {
      await this.requestNextExercise();
    }
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

  private async registerExerciseResult(exerciseId: number, exerciseResult: ExerciseResult) {
    const toastPromise = this.showToastForExerciseResult(exerciseResult);
    const exerciseCorrectStreakCap = await this.settings$.pipe(first()).toPromise()
      .then(settings => settings.exerciseCorrectStreakCap);
    const registerPromise = this.exerciseService.registerExerciseExperience({
      exerciseId,
      exerciseResult,
      exerciseCorrectStreakCap
    });
    await Promise.all([toastPromise, registerPromise]);
  }

  private async showToastForExerciseResult(exerciseResult: ExerciseResult) {
    const toast = await this.toastController.create({
      header: exerciseResult === 'SUCCESS'
        ? await this.translateService.get('messages.success').toPromise()
        : await this.translateService.get('messages.failure').toPromise(),
      duration: 2500,
      color: exerciseResult === 'SUCCESS' ? 'success' : 'danger',
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
}
