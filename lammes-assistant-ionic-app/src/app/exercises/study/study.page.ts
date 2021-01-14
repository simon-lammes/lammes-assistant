import {Component, ViewChild} from '@angular/core';
import {Exercise, ExerciseResult, ExercisesService, Experience, HydratedExercise} from '../exercises.service';
import {switchMap} from 'rxjs/operators';
import {IonContent, PopoverController, ToastController} from '@ionic/angular';
import {Observable} from 'rxjs';
import {StudyPopoverComponent} from './study-popover/study-popover.component';

@Component({
  selector: 'app-study',
  templateUrl: './study.page.html',
  styleUrls: ['./study.page.scss'],
})
export class StudyPage {
  @ViewChild(IonContent) ionContent: IonContent;

  /**
   * The current experience that the user is "working on". Contains the current exercise.
   */
  experience$: Observable<Experience> = this.exercisesService.usersNextExperience$;
  hydratedExercise$ = this.experience$.pipe(
    switchMap(experience => this.exercisesService.getHydratedExercise(experience?.exercise))
  );
  studyProgress$ = this.exercisesService.studyProgress$;

  isSolutionVisible: boolean;
  currentExerciseResult?: ExerciseResult = undefined;

  /**
   * In a "trueOrFalse" exercise, the user either said that a statement was true or that it was false.
   */
  trueOrFalseSelection?: boolean;

  constructor(
    private exercisesService: ExercisesService,
    private toastController: ToastController,
    private popoverController: PopoverController
  ) {
  }

  showSolution() {
    this.isSolutionVisible = true;
  }

  private async registerExerciseResult(exerciseKey: string, exerciseResult: ExerciseResult) {
    this.currentExerciseResult = exerciseResult;
    await this.exercisesService.registerExerciseExperience({
      exerciseKey,
      exerciseResult
    });
  }

  async requestNextExercise() {
    this.exercisesService.requestNextExercise();
    this.isSolutionVisible = false;
    this.currentExerciseResult = undefined;
    this.trueOrFalseSelection = undefined;
    await this.ionContent.scrollToTop(600);
  }

  async onUserEvaluatedStatementOfTrueOrFalseExercise(exerciseKey: string, exercise: HydratedExercise, evaluation: boolean) {
    const isUserRight = exercise.isStatementCorrect === evaluation;
    this.isSolutionVisible = true;
    this.currentExerciseResult = isUserRight ? 'SUCCESS' : 'FAILURE';
    this.trueOrFalseSelection = evaluation;
    const toastPromise = this.showToastForExerciseResult(this.currentExerciseResult);
    const registerPromise = this.registerExerciseResult(exerciseKey, this.currentExerciseResult);
    await Promise.all([toastPromise, registerPromise]);
  }

  private async showToastForExerciseResult(exerciseResult: ExerciseResult) {
    const toast = await this.toastController.create({
      header: exerciseResult === 'SUCCESS' ? 'Success' : 'Failure',
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

  async onUserReview(experience: Experience, reviewResult: ExerciseResult) {
    const toastPromise = this.showToastForExerciseResult(reviewResult);
    const registerPromise = this.registerExerciseResult(experience.exercise.key, reviewResult);
    await Promise.all([toastPromise, registerPromise]);
    await this.requestNextExercise();
  }

  getRightOrWrongButtonColor(isRightButton: boolean) {
    if (this.trueOrFalseSelection === isRightButton) {
      return this.currentExerciseResult === 'SUCCESS' ? 'success' : 'danger';
    }
    return 'medium';
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
}
