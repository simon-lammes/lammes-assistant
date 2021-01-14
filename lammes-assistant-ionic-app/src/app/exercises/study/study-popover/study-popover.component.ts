import {Component, Input} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {SaveExerciseModalPage} from '../../save-exercise-modal/save-exercise-modal.page';
import {Exercise} from '../../exercises.service';

@Component({
  selector: 'app-study-popover',
  templateUrl: './study-popover.component.html',
  styleUrls: ['./study-popover.component.scss'],
})
export class StudyPopoverComponent {

  @Input()
  private exercise: Exercise;

  constructor(
    public popoverController: PopoverController,
    private modalController: ModalController
  ) {
  }

  async dismissPopover() {
    await this.popoverController.dismiss();
  }

  async editExercise() {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage,
      componentProps: {
        editedExercise: this.exercise
      }
    });
    await modal.present();
    await this.popoverController.dismiss();
  }
}
