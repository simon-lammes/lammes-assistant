import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';
import {ExercisesService} from './exercises.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage {

  exercises$ = this.exercisesService.usersExercises$;

  constructor(
    private modalController: ModalController,
    private exercisesService: ExercisesService,
    private router: Router
  ) {
  }

  async createExercise() {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage
    });
    return await modal.present();
  }

  async startStudying() {
    await this.router.navigateByUrl('/tabs/exercises/study');
  }
}
