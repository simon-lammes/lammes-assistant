import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StandardExerciseComponent} from './standard-exercise/standard-exercise.component';
import {IonicModule} from '@ionic/angular';
import {TrueOrFalseExerciseComponent} from './true-or-false-exercise/true-or-false-exercise.component';
import {ExerciseFragmentModule} from '../exercise-fragment/exercise-fragment.module';

@NgModule({
  declarations: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent
  ],
  exports: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ExerciseFragmentModule
  ]
})
export class ExerciseTypesModule { }
