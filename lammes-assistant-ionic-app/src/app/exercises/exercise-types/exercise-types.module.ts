import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StandardExerciseComponent} from './standard-exercise/standard-exercise.component';
import {IonicModule} from '@ionic/angular';
import {TrueOrFalseExerciseComponent} from './true-or-false-exercise/true-or-false-exercise.component';
import {EnrichedMarkdownModule} from '../../shared/enriched-markdown/enriched-markdown.module';
import {MultiselectExerciseComponent} from './multiselect-exercise/multiselect-exercise.component';

@NgModule({
  declarations: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent
  ],
  exports: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    EnrichedMarkdownModule
  ]
})
export class ExerciseTypesModule { }
