import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StandardExerciseComponent} from './standard-exercise/standard-exercise.component';
import {IonicModule} from '@ionic/angular';
import {TrueOrFalseExerciseComponent} from './true-or-false-exercise/true-or-false-exercise.component';
import {EnrichedMarkdownModule} from '../../shared/enriched-markdown/enriched-markdown.module';

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
    EnrichedMarkdownModule
  ]
})
export class ExerciseTypesModule { }
