import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseFeedbackBoxComponent} from './exercise-feedback-box.component';
import {SharedModule} from '../../shared/shared.module';


@NgModule({
  declarations: [
    ExerciseFeedbackBoxComponent
  ],
  exports: [
    ExerciseFeedbackBoxComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ExerciseFeedbackBoxModule { }
