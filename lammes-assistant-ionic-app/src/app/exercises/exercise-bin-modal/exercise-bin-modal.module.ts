import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseBinModalComponent} from './exercise-bin-modal.component';
import {IonicModule} from '@ionic/angular';
import {SharedModule} from '../../shared/shared.module';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule
  ],
  declarations: [
    ExerciseBinModalComponent
  ]
})
export class ExerciseBinModalModule { }
