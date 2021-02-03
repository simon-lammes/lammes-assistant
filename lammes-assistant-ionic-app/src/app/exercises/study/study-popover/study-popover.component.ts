import {Component, Input} from '@angular/core';
import {AlertController, ModalController, PopoverController, ToastController} from '@ionic/angular';
import {SaveExerciseModalPage} from '../../save-exercise-modal/save-exercise-modal.page';
import {Exercise, ExerciseService} from '../../../shared/services/exercise/exercise.service';
import {TranslateService} from '@ngx-translate/core';

export interface StudyPopoverResult {
  gotExperienceSuspended?: boolean;
}

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
    private modalController: ModalController,
    private exerciseService: ExerciseService,
    private translateService: TranslateService,
    private toastController: ToastController,
    private alertController: AlertController
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

  async suspendExperience() {
    const alert = await this.alertController.create({
      header: await this.translateService.get('suspend-experience').toPromise(),
      message: await this.translateService.get('questions.suspend-experience').toPromise(),
      buttons: [
        {
          text: await this.translateService.get('cancel').toPromise(),
          role: 'cancel',
          handler: async () => {
            await this.popoverController.dismiss();
          }
        },
        {
          text: await this.translateService.get('suspend-experience').toPromise(),
          handler: async () => {
            await this.exerciseService.suspendExperience(this.exercise.id);
            const toastPromise = this.showToast(await this.translateService.get('messages.experience-suspended').toPromise());
            const dismissPromise = this.popoverController.dismiss({gotExperienceSuspended: true} as StudyPopoverResult);
            await Promise.all([toastPromise, dismissPromise]);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      header: message,
      duration: 3500,
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
