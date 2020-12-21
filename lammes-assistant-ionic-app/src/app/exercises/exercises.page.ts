import {Component} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';
import {Exercise, ExercisesService} from './exercises.service';
import {Router} from '@angular/router';
import {ExercisesPopoverComponent} from './exercises-popover/exercises-popover.component';

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
    private router: Router,
    private popoverController: PopoverController
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

  async removeExercise(exercise: Exercise) {
    await this.exercisesService.removeExercise({id: exercise.id});
  }

  async showPopover(event: any) {
    const popover = await this.popoverController.create({
      component: ExercisesPopoverComponent,
      event,
      translucent: true
    });
    return await popover.present();
  }
}
