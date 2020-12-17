import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {ExercisesPageRoutingModule} from './exercises-routing.module';

import {ExercisesPage} from './exercises.page';
import {SaveExerciseModalPageModule} from './save-exercise-modal/save-exercise-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExercisesPageRoutingModule,
    SaveExerciseModalPageModule
  ],
  declarations: [ExercisesPage]
})
export class ExercisesPageModule {}
