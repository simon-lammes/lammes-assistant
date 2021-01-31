import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {ProfilePageRoutingModule} from './profile-routing.module';

import {ProfilePage} from './profile.page';
import {SharedModule} from '../../shared/shared.module';
import {NgxFileHelpersModule} from 'ngx-file-helpers';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule,
    SharedModule,
    NgxFileHelpersModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
