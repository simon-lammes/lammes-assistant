import {Component, Input, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsService} from '../../shared/services/custom-forms.service';
import {Group, GroupService} from '../../shared/services/group/group.service';
import {TranslateService} from '@ngx-translate/core';

export interface SaveGroupModalInput {
  editedGroup?: Group;
}

@Component({
  selector: 'app-save-group',
  templateUrl: './save-group.component.html',
  styleUrls: ['./save-group.component.scss'],
})
export class SaveGroupComponent implements OnInit {
  groupForm: FormGroup;

  @Input()
  input?: SaveGroupModalInput;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private customFormsService: CustomFormsService,
    private groupService: GroupService,
    private toastController: ToastController,
    private translateService: TranslateService
  ) {
  }

  get isEditingExistingGroup(): boolean {
    return !!this.input?.editedGroup;
  }

  ngOnInit() {
    this.groupForm = this.fb.group({
      name: this.fb.control(this.input?.editedGroup?.name ?? '', [Validators.required]),
      description: this.fb.control(this.input?.editedGroup?.description ?? '')
    });
  }

  dismissModal() {
    return this.modalController.dismiss();
  }

  trim(formControl: AbstractControl, removeUnnecessaryWhitespacesInBetween: boolean = true) {
    if (removeUnnecessaryWhitespacesInBetween) {
      this.customFormsService.trimAndRemoveNeighboringWhitespaces(formControl);
    } else {
      this.customFormsService.trim(formControl);
    }
  }

  async saveGroup() {
    if (this.isEditingExistingGroup) {
      await this.groupService.editGroup(this.input.editedGroup.id, this.groupForm.value);
      await this.showHint(await this.translateService.get('messages.group-edited').toPromise(), 'success', 1500);
    } else {
      await this.groupService.createGroup(this.groupForm.value);
      await this.showHint(await this.translateService.get('messages.group-created').toPromise(), 'success', 1500);
    }
    await this.modalController.dismiss();
  }

  private async showHint(message: string, color = 'primary', duration?: number) {
    const toast = await this.toastController.create({
      header: message,
      color,
      duration,
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
