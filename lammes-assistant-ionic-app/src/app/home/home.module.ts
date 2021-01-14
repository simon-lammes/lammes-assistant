import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {HomePageRoutingModule} from './home-routing.module';

import {HomePage} from './home.page';
import {EditNoteModalPageModule} from '../notes/edit-note/edit-note-modal.module';
import {MarkdownModule} from 'ngx-markdown';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    EditNoteModalPageModule,
    MarkdownModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
