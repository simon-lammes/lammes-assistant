import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StandardExerciseComponent} from './standard-exercise/standard-exercise.component';
import {IonicModule} from '@ionic/angular';
import {TrueOrFalseExerciseComponent} from './true-or-false-exercise/true-or-false-exercise.component';
import {EnrichedMarkdownModule} from '../../shared/enriched-markdown/enriched-markdown.module';
import {MultiselectExerciseComponent} from './multiselect-exercise/multiselect-exercise.component';
import {OrderingExerciseComponent} from './ordering-exercise/ordering-exercise.component';
import {SharedModule} from '../../shared/shared.module';

@NgModule({
  declarations: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent
  ],
  exports: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    EnrichedMarkdownModule,
    SharedModule
  ]
})
export class ExerciseTypesModule { }
