import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseContainerComponent} from './exercise-container.component';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';
import {ExerciseFeedbackBoxModule} from '../exercise-feedback-box/exercise-feedback-box.module';


@NgModule({
  declarations: [
    ExerciseContainerComponent
  ],
  exports: [
    ExerciseContainerComponent
  ],
  imports: [
    CommonModule,
    ExerciseTypesModule,
    ExerciseFeedbackBoxModule
  ]
})
export class ExerciseContainerModule { }
