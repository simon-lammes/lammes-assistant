import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExerciseFragmentComponent} from './exercise-fragment.component';
import {PdfViewerModule} from 'ng2-pdf-viewer';
import {IonicModule} from '@ionic/angular';


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
    IonicModule
  ]
})
export class ExerciseFragmentModule { }
