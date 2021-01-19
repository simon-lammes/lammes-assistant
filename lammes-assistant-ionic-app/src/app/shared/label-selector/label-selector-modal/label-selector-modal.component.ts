import {Component, Input, OnInit} from '@angular/core';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {Observable} from 'rxjs';
import {Settings, SettingsService} from '../../../settings/settings.service';
import {first, map} from 'rxjs/operators';

const labelRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

@Component({
  selector: 'app-label-selector-modal',
  templateUrl: './label-selector-modal.component.html',
  styleUrls: ['./label-selector-modal.component.scss'],
})
export class LabelSelectorModalComponent implements OnInit {
  settings$: Observable<Settings> = this.settingsService.currentSettings$;

  @Input()
  initiallySelectedLabels: Set<string>;

  selectedLabels: Set<string>;

  allDisplayedLabels$: Observable<string[]>;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private settingsService: SettingsService
  ) {
  }

  ngOnInit(): void {
    this.selectedLabels = new Set<string>(this.initiallySelectedLabels);
    this.allDisplayedLabels$ = this.settings$.pipe(
      map(settings => [...new Set([...settings.myExerciseLabels, ...this.initiallySelectedLabels])].sort())
    );
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  onChangeLabelSelection(event: CustomEvent, label: string) {
    const {detail: {checked}} = event;
    if (checked) {
      this.selectedLabels.add(label);
    } else {
      this.selectedLabels.delete(label);
    }
  }

  async set() {
    await this.modalController.dismiss({
      selectedLabels: this.selectedLabels
    });
  }

  async createNewLabel() {
    const alert = await this.alertController.create({
      header: 'Create New Label',
      inputs: [
        {
          name: 'label',
          type: 'text',
          placeholder: 'Label'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (result: { label: string }) => {
            const {label} = result;
            const doesFollowNamingConvention = labelRegex.test(label);
            if (!doesFollowNamingConvention) {
              await this.showHint('Tags need to follow this naming naming pattern: \'my-label-1\'');
              return;
            }
            const currentSettings = await this.settings$.pipe(first()).toPromise();
            const newSettings: Settings = {
              ...currentSettings,
              myExerciseLabels: [...currentSettings.myExerciseLabels, label]
            };
            await this.settingsService.saveSettings(newSettings);
            this.selectedLabels.add(label);
            this.selectedLabels = new Set<string>(this.selectedLabels);
          }
        }
      ]
    });
    await alert.present();
    // I do not know a nicer way of autofocusing the first input element.
    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  private async showHint(message: string) {
    const toast = await this.toastController.create({
      header: message,
      duration: 6500,
      color: 'warning',
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
