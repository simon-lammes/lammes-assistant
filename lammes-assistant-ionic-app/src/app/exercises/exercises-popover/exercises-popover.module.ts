import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExercisesPopoverComponent} from './exercises-popover.component';
import {IonicModule} from '@ionic/angular';
import {ExerciseBinModalModule} from '../exercise-bin-modal/exercise-bin-modal.module';


@NgModule({
  declarations: [
    ExercisesPopoverComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ExerciseBinModalModule
  ]
})
export class ExercisesPopoverModule { }
