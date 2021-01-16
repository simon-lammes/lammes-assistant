import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {SaveExerciseModalPage} from './save-exercise-modal.page';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';
import {NgxFileHelpersModule} from 'ngx-file-helpers';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    ExerciseTypesModule,
    NgxFileHelpersModule,
  ],
  declarations: [SaveExerciseModalPage]
})
export class SaveExerciseModalPageModule {
}
