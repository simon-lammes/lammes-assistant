import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {GroupDetailPage} from './group-detail.page';

const routes: Routes = [
  {
    path: '',
    component: GroupDetailPage
  },
  {
    path: 'membership/:memberId',
    loadChildren: () => import('./group-membership-detail/group-membership-detail.module').then(m => m.GroupMembershipDetailPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupDetailPageRoutingModule {}
