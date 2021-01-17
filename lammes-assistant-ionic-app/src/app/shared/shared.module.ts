import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LabelSelectorComponent} from './label-selector/label-selector.component';
import {IonicModule} from '@ionic/angular';
import {LabelSelectorModalComponent} from './label-selector/label-selector-modal/label-selector-modal.component';


@NgModule({
  declarations: [
    LabelSelectorComponent,
    LabelSelectorModalComponent
  ],
  exports: [
    LabelSelectorComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class SharedModule { }
