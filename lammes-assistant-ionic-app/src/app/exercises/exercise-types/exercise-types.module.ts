import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StandardExerciseComponent} from './standard-exercise/standard-exercise.component';
import {IonicModule} from '@ionic/angular';
import {TrueOrFalseExerciseComponent} from './true-or-false-exercise/true-or-false-exercise.component';
import {EnrichedMarkdownModule} from '../../shared/components/enriched-markdown/enriched-markdown.module';
import {MultiselectExerciseComponent} from './multiselect-exercise/multiselect-exercise.component';
import {OrderingExerciseComponent} from './ordering-exercise/ordering-exercise.component';
import {SharedModule} from '../../shared/shared.module';
import {PromptExerciseComponent} from './prompt-exercise/prompt-exercise.component';
import {ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent,
    PromptExerciseComponent
  ],
  exports: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent,
    PromptExerciseComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    EnrichedMarkdownModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ExerciseTypesModule { }
