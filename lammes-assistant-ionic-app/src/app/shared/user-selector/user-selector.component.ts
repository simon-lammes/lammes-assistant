import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {UserSelectorModalComponent} from './user-selector-modal/user-selector-modal.component';
import {UsersService} from '../services/users/users.service';

@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => UserSelectorComponent)
    }
  ]
})
export class UserSelectorComponent implements ControlValueAccessor {
  @Input()
  heading: string;

  /**
   * This text is displayed when no labels are selected.
   */
  @Input()
  noSelectionText = '';

  isDisabled = false;
  selectedUserIds = new Set<number>();
  private onChange: (selectedUsers: string[]) => void;
  private onTouched: () => void;

  constructor(
    private modalController: ModalController,
    private usersService: UsersService
  ) {
  }

  writeValue(obj: any): void {
    this.selectedUserIds = new Set<number>(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  async openUserSelectorModal() {
    const modal = await this.modalController.create({
      component: UserSelectorModalComponent,
      componentProps: {
        initiallySelectedUserIds: this.selectedUserIds
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss();
    if (!data) {
      return;
    }
    const {selectedUserIds = this.selectedUserIds} = data;
    this.selectedUserIds = selectedUserIds;
    this.onChange([...selectedUserIds]);
  }

  getValueRepresentation() {
    if (this.selectedUserIds.size === 0) {
      return this.noSelectionText;
    }
    return [...this.selectedUserIds].map(userId => this.usersService.getCachedUserById(userId)?.username ?? userId).join(', ');
  }
}
