import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {LabelSelectorModalComponent} from './label-selector-modal/label-selector-modal.component';

@Component({
  selector: 'app-label-selector',
  templateUrl: './label-selector.component.html',
  styleUrls: ['./label-selector.component.scss'],
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => LabelSelectorComponent)
    }
  ]
})
export class LabelSelectorComponent implements ControlValueAccessor {
  @Input()
  heading: string;

  isDisabled = false;
  selectedLabels: Set<string>;
  private onChange: (labels: string[]) => void;
  private onTouched: () => void;

  constructor(
    private modalController: ModalController
  ) {
  }

  writeValue(obj: any): void {
    this.selectedLabels = new Set<string>(obj);
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

  getSelectedLabelsConcatenated() {
    return [...this.selectedLabels].join(', ');
  }

  async openLabelSelectorModal() {
    const modal = await this.modalController.create({
      component: LabelSelectorModalComponent,
      componentProps: {
        initiallySelectedLabels: this.selectedLabels
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss();
    if (!data) {
      return;
    }
    const {selectedLabels = this.selectedLabels} = data;
    this.selectedLabels = selectedLabels;
    this.onChange([...selectedLabels]);
  }
}
