import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {SaveExerciseModalPage} from './save-exercise-modal.page';
import {NgxFileHelpersModule} from 'ngx-file-helpers';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    NgxFileHelpersModule,
    ExerciseTypesModule,
  ],
  declarations: [SaveExerciseModalPage]
})
export class SaveExerciseModalPageModule {
}
