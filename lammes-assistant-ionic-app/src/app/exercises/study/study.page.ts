import {Component, ViewChild} from '@angular/core';
import {ExerciseResult, ExercisesService} from '../exercises.service';
import {switchMap} from 'rxjs/operators';
import {IonContent, ToastController} from '@ionic/angular';

@Component({
  selector: 'app-study',
  templateUrl: './study.page.html',
  styleUrls: ['./study.page.scss'],
})
export class StudyPage {
  @ViewChild(IonContent) ionContent: IonContent;
  experience$ = this.exercisesService.usersNextExperience$;
  exercise$ = this.experience$.pipe(
    switchMap(experience => this.exercisesService.getHydratedExercise(experience?.exercise))
  );
  isSolutionVisible = false;

  constructor(
    private exercisesService: ExercisesService,
    private toastController: ToastController
  ) {
  }

  showSolution() {
    this.isSolutionVisible = true;
  }

  async registerExerciseResult(exerciseKey: string, exerciseResult: ExerciseResult) {
    this.isSolutionVisible = false;
    const scrollingPromise = this.ionContent.scrollToTop(600);
    const writePromise = this.exercisesService.registerExerciseExperience({
      exerciseKey,
      exerciseResult
    });
    const toastPromise = this.showToastForExerciseResult(exerciseResult);
    await Promise.all([scrollingPromise, writePromise, toastPromise]);
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
}
