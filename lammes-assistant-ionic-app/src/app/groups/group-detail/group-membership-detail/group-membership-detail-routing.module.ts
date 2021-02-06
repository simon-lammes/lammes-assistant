import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {GroupMembershipDetailPage} from './group-membership-detail.page';

const routes: Routes = [
  {
    path: '',
    component: GroupMembershipDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupMembershipDetailPageRoutingModule {}
