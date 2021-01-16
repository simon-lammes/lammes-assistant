import {Component, ViewChild} from '@angular/core';
import {Exercise, ExerciseResult, ExercisesService, Experience, HydratedExercise} from '../exercises.service';
import {switchMap} from 'rxjs/operators';
import {IonContent, PopoverController, ToastController} from '@ionic/angular';
import {Observable} from 'rxjs';
import {StudyPopoverComponent} from './study-popover/study-popover.component';

export interface ExerciseState {
  exerciseResult?: ExerciseResult;
  nextExerciseRequested?: boolean;
}

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

  constructor(
    private exercisesService: ExercisesService,
    private toastController: ToastController,
    private popoverController: PopoverController
  ) {
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

  async onExerciseStateChanged(exercise: HydratedExercise, {exerciseResult, nextExerciseRequested}: ExerciseState) {
    if (exerciseResult) {
      const toastPromise = this.showToastForExerciseResult(exerciseResult);
      const registerPromise = this.registerExerciseResult(exercise.id, exerciseResult);
      await Promise.all([toastPromise, registerPromise]);
    }
    if (nextExerciseRequested) {
      this.exercisesService.requestNextExercise();
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
}
