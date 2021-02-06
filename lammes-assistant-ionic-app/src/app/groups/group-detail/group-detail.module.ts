import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {GroupDetailPageRoutingModule} from './group-detail-routing.module';

import {GroupDetailPage} from './group-detail.page';
import {SharedModule} from '../../shared/shared.module';
import {MarkdownModule} from 'ngx-markdown';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupDetailPageRoutingModule,
    SharedModule,
    MarkdownModule
  ],
  declarations: [GroupDetailPage]
})
export class GroupDetailPageModule {}
