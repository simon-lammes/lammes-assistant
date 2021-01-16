import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {StudyPageRoutingModule} from './study-routing.module';

import {StudyPage} from './study.page';
import {StudyPopoverModule} from './study-popover/study-popover.module';
import {ExerciseTypesModule} from '../exercise-types/exercise-types.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudyPageRoutingModule,
    StudyPopoverModule,
    ExerciseTypesModule
  ],
  declarations: [StudyPage]
})
export class StudyPageModule {}
