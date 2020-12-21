import {Component} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {ExerciseBinModalComponent} from '../exercise-bin-modal/exercise-bin-modal.component';

@Component({
  selector: 'app-exercises-popover',
  templateUrl: './exercises-popover.component.html',
  styleUrls: ['./exercises-popover.component.scss'],
})
export class ExercisesPopoverComponent {

  constructor(
    public popoverController: PopoverController,
    private modalController: ModalController
  ) { }

  async dismissPopover() {
    await this.popoverController.dismiss();
  }

  async showExerciseBin() {
    const modal = await this.modalController.create({
      component: ExerciseBinModalComponent,
    });
    await modal.present();
    await this.popoverController.dismiss();
  }
}
