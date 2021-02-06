import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {GroupMembershipDetailPageRoutingModule} from './group-membership-detail-routing.module';

import {GroupMembershipDetailPage} from './group-membership-detail.page';
import {SharedModule} from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupMembershipDetailPageRoutingModule,
    SharedModule
  ],
  declarations: [GroupMembershipDetailPage]
})
export class GroupMembershipDetailPageModule {}
