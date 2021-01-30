import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StudyPopoverComponent} from './study-popover.component';
import {IonicModule} from '@ionic/angular';
import {SharedModule} from '../../../shared/shared.module';


@NgModule({
  declarations: [
    StudyPopoverComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    SharedModule
  ]
})
export class StudyPopoverModule { }
