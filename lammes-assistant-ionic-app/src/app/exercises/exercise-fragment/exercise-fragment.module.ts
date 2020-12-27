import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseFragmentComponent} from './exercise-fragment.component';
import {PdfViewerModule} from 'ng2-pdf-viewer';
import {IonicModule} from '@ionic/angular';
import {MarkdownModule} from 'ngx-markdown';


@NgModule({
  declarations: [
    ExerciseFragmentComponent
  ],
  exports: [
    ExerciseFragmentComponent
  ],
  imports: [
    CommonModule,
    PdfViewerModule,
    IonicModule,
    MarkdownModule
  ]
})
export class ExerciseFragmentModule { }
