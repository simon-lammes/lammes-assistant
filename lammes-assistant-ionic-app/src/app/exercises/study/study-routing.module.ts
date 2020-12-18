import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {StudyPage} from './study.page';

const routes: Routes = [
  {
    path: '',
    component: StudyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudyPageRoutingModule {}
