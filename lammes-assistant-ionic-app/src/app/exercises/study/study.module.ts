import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {StudyPageRoutingModule} from './study-routing.module';

import {StudyPage} from './study.page';
import {PdfViewerModule} from 'ng2-pdf-viewer';
import {ExerciseFragmentModule} from '../exercise-fragment/exercise-fragment.module';
import {StudyPopoverModule} from './study-popover/study-popover.module';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudyPageRoutingModule,
    PdfViewerModule,
    ExerciseFragmentModule,
    StudyPopoverModule,
    ExerciseTypesModule
  ],
  declarations: [StudyPage]
})
export class StudyPageModule {}
