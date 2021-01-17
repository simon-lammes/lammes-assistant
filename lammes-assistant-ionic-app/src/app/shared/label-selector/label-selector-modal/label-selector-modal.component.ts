import {Component, Input} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Label, LabelsService} from '../labels.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-label-selector-modal',
  templateUrl: './label-selector-modal.component.html',
  styleUrls: ['./label-selector-modal.component.scss'],
})
export class LabelSelectorModalComponent {
  labels$: Observable<Label[]> = this.labelsService.usersFavoriteLabels$;

  @Input()
  selectedLabels: string[];

  constructor(
    private modalController: ModalController,
    private labelsService: LabelsService
  ) {
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  onChangeLabelSelection(event: CustomEvent, label: Label) {
    const {detail: {checked}} = event;
    if (checked) {
      this.selectedLabels.push(label.title);
    } else {
      this.selectedLabels = this.selectedLabels.filter(x => x !== label.title);
    }
  }

  async set() {
    await this.modalController.dismiss({
      selectedLabels: this.selectedLabels.sort()
    });
  }
}
