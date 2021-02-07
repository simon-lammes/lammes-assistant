import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {GroupSelectModalComponent} from './group-select-modal/group-select-modal.component';

@Component({
  selector: 'app-group-select',
  templateUrl: './group-select.component.html',
  styleUrls: ['./group-select.component.scss'],
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => GroupSelectComponent)
    }
  ]
})
export class GroupSelectComponent implements ControlValueAccessor {
  @Input()
  label: string;

  /**
   * This text is displayed when no labels are selected.
   */
  @Input()
  noSelectionText = '';

  selectedGroupIds: Set<number>;
  private onChange: (selectedGroupIds: number[]) => void;
  private onTouched: () => void;

  constructor(
    private modalController: ModalController
  ) {
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    this.selectedGroupIds = new Set<number>(obj);
  }

  async openGroupSelectModal() {
    const modal = await this.modalController.create({
      component: GroupSelectModalComponent,
      componentProps: {
        initiallySelectedGroupIds: this.selectedGroupIds
      }
    });
    await modal.present();
    const {data: selectedGroupIds} = await modal.onWillDismiss();
    if (!selectedGroupIds) {
      return;
    }
    this.selectedGroupIds = selectedGroupIds;
    this.onChange([...this.selectedGroupIds]);
  }

  getValueRepresentation() {
    if (this.selectedGroupIds.size === 0) {
      return this.noSelectionText;
    }
    return [...this.selectedGroupIds].join(', ');
  }
}
