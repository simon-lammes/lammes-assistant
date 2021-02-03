import {Component} from '@angular/core';
import {AlertController, ModalController, NavParams, PopoverController} from '@ionic/angular';
import {ExerciseBinModalComponent} from '../exercise-bin-modal/exercise-bin-modal.component';
import {ExerciseFilterDefinition, ExerciseService} from '../../shared/services/exercise/exercise.service';
import {TranslateService} from '@ngx-translate/core';

export interface ExercisesPopoverInput {
  exerciseFilterDefinition: ExerciseFilterDefinition;
}

@Component({
  selector: 'app-exercises-popover',
  templateUrl: './exercises-popover.component.html',
  styleUrls: ['./exercises-popover.component.scss'],
})
export class ExercisesPopoverComponent {
  input: ExercisesPopoverInput;

  constructor(
    public popoverController: PopoverController,
    private modalController: ModalController,
    private navParams: NavParams,
    private exerciseService: ExerciseService,
    private alertController: AlertController,
    private translateService: TranslateService
  ) {
    this.input = this.navParams.data as ExercisesPopoverInput;
  }

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

  async saveExerciseFilter() {
    const alert = await this.alertController.create({
      header: await this.translateService.get('create-exercise-filter').toPromise(),
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: await this.translateService.get('title').toPromise()
        }
      ],
      buttons: [
        {
          text: await this.translateService.get('cancel').toPromise(),
          role: 'cancel',
          handler: async () => {
            await this.popoverController.dismiss();
          }
        },
        {
          text: await this.translateService.get('save').toPromise(),
          handler: async ({title}: {title: string}) => {
            await this.exerciseService.createExerciseFilter(title, this.input.exerciseFilterDefinition);
            await this.popoverController.dismiss();
          }
        }
      ]
    });
    await alert.present();
    // I do not know a nicer way of autofocusing the first input element.
    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }
}
