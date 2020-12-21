import {Component} from '@angular/core';
import {Exercise, ExercisesService} from '../exercises.service';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-exercise-bin-modal',
  templateUrl: './exercise-bin-modal.component.html',
  styleUrls: ['./exercise-bin-modal.component.scss'],
})
export class ExerciseBinModalComponent {

  exercises$ = this.exerciseService.usersExercisesThatAreMarkedForDeletion$;

  constructor(
    private exerciseService: ExercisesService,
    private modalController: ModalController
  ) {
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  async restoreExercise(exercise: Exercise) {
    await this.exerciseService.restoreExercise(exercise);
  }
}
