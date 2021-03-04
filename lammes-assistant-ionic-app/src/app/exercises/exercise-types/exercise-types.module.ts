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
import {DirectedGraphAssemblyExerciseComponent} from './directed-graph-assembly-exercise/directed-graph-assembly-exercise.component';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {DirectedGraphComponent} from './directed-graph-assembly-exercise/directed-graph/directed-graph.component';
import {MappingExerciseComponent} from './mapping-exercise/mapping-exercise.component';
import {ExerciseFeedbackBoxModule} from '../exercise-feedback-box/exercise-feedback-box.module';

@NgModule({
  declarations: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent,
    PromptExerciseComponent,
    DirectedGraphAssemblyExerciseComponent,
    DirectedGraphComponent,
    MappingExerciseComponent
  ],
  exports: [
    StandardExerciseComponent,
    TrueOrFalseExerciseComponent,
    MultiselectExerciseComponent,
    OrderingExerciseComponent,
    PromptExerciseComponent,
    DirectedGraphAssemblyExerciseComponent,
    MappingExerciseComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    EnrichedMarkdownModule,
    SharedModule,
    ReactiveFormsModule,
    NgxGraphModule,
    ExerciseFeedbackBoxModule
  ]
})
export class ExerciseTypesModule { }
