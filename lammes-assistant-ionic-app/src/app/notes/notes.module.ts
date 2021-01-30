import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {NotesPageRoutingModule} from './notes-routing.module';

import {NotesPage} from './notes.page';
import {EditNoteModalPageModule} from './edit-note/edit-note-modal.module';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotesPageRoutingModule,
    EditNoteModalPageModule,
    SharedModule
  ],
  declarations: [NotesPage]
})
export class NotesPageModule {}
