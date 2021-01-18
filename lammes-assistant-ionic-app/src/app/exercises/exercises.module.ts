import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {ExercisesPageRoutingModule} from './exercises-routing.module';

import {ExercisesPage} from './exercises.page';
import {SaveExerciseModalPageModule} from './save-exercise-modal/save-exercise-modal.module';
import {ExerciseBinModalModule} from './exercise-bin-modal/exercise-bin-modal.module';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExercisesPageRoutingModule,
    SaveExerciseModalPageModule,
    ExerciseBinModalModule,
    SharedModule,
    ReactiveFormsModule
  ],
  declarations: [ExercisesPage]
})
export class ExercisesPageModule {}
