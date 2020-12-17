import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';

@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage {

  constructor(
    private modalController: ModalController
  ) {
  }

  async createExercise() {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage
    });
    return await modal.present();
  }
}
