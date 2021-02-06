import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {GroupDetailPage} from './group-detail.page';

const routes: Routes = [
  {
    path: '',
    component: GroupDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupDetailPageRoutingModule {}
