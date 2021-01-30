import {Component, OnInit, ViewChild} from '@angular/core';
import {Exercise, ExerciseFilter, ExerciseResult, ExercisesService, HydratedExercise} from '../exercises.service';
import {map, switchMap} from 'rxjs/operators';
import {IonContent, PopoverController, ToastController} from '@ionic/angular';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {StudyPopoverComponent} from './study-popover/study-popover.component';
import {ActivatedRoute} from '@angular/router';
import {SettingsService} from '../../settings/settings.service';
import {isNumeric} from 'rxjs/internal-compatibility';
import {TranslateService} from '@ngx-translate/core';

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
  @ViewChild(IonContent) ionContent: IonContent;
  studyProgress$ = this.exercisesService.studyProgress$;
  exerciseFilter$: Observable<ExerciseFilter>;
  exercise$: Observable<Exercise>;
  hydratedExercise$: Observable<HydratedExercise>;
  private nextExerciseRequestedBehaviourSubject = new BehaviorSubject(true);
  nextExerciseRequested$ = this.nextExerciseRequestedBehaviourSubject.asObservable();

  constructor(
    private exercisesService: ExercisesService,
    private toastController: ToastController,
    private popoverController: PopoverController,
    private activatedRoute: ActivatedRoute,
    private settingsService: SettingsService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit(): void {
    this.exerciseFilter$ = this.activatedRoute.queryParamMap.pipe(
      map((params) => {
        return {
          labels: params.getAll('labels'),
          creatorIds: params.getAll('creatorIds').map(labelString => +labelString),
          languageCodes: params.getAll('languageCodes'),
          maximumCorrectStreak: isNumeric(params.get('maximumCorrectStreak')) ? +params.get('maximumCorrectStreak') : undefined
        } as ExerciseFilter;
      })
    );
    this.exercise$ = combineLatest([
      this.nextExerciseRequested$,
      this.settingsService.exerciseCooldown$,
      this.exerciseFilter$
    ]).pipe(
      switchMap(([, exerciseCooldown, exerciseFilter]) => {
        return this.exercisesService.getNextExercise(exerciseCooldown, exerciseFilter);
      })
    );
    this.hydratedExercise$ = this.exercise$.pipe(
      switchMap(exercise => this.exercisesService.getHydratedExercise(exercise))
    );
  }

  async onExerciseStateChanged(exercise: HydratedExercise, {exerciseResult, nextExerciseRequested}: ExerciseState) {
    if (exerciseResult) {
      const toastPromise = this.showToastForExerciseResult(exerciseResult);
      const registerPromise = this.registerExerciseResult(exercise.id, exerciseResult);
      await Promise.all([toastPromise, registerPromise]);
    }
    if (nextExerciseRequested) {
      this.nextExerciseRequestedBehaviourSubject.next(true);
      await this.ionContent.scrollToTop(600);
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
    return await popover.present();
  }

  private async registerExerciseResult(exerciseId: number, exerciseResult: ExerciseResult) {
    const toastPromise = this.showToastForExerciseResult(exerciseResult);
    const registerPromise = this.exercisesService.registerExerciseExperience({
      exerciseId,
      exerciseResult
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
