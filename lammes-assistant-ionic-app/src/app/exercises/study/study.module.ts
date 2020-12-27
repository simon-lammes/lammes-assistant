import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {StudyPageRoutingModule} from './study-routing.module';

import {StudyPage} from './study.page';
import {PdfViewerModule} from 'ng2-pdf-viewer';
import {ExerciseFragmentModule} from '../exercise-fragment/exercise-fragment.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudyPageRoutingModule,
    PdfViewerModule,
    ExerciseFragmentModule
  ],
  declarations: [StudyPage]
})
export class StudyPageModule {}