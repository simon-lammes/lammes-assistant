import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {GroupsPageRoutingModule} from './groups-routing.module';

import {GroupsPage} from './groups.page';
import {SharedModule} from '../shared/shared.module';
import {SaveGroupComponent} from './save-group/save-group.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupsPageRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ],
  declarations: [
    GroupsPage,
    SaveGroupComponent
  ]
})
export class GroupsPageModule {}
