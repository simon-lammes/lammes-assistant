import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseContainerComponent} from './exercise-container.component';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';


@NgModule({
  declarations: [
    ExerciseContainerComponent
  ],
  exports: [
    ExerciseContainerComponent
  ],
  imports: [
    CommonModule,
    ExerciseTypesModule
  ]
})
export class ExerciseContainerModule { }
