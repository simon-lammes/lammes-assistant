import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {NotesPageRoutingModule} from './notes-routing.module';

import {NotesPage} from './notes.page';
import {EditNoteModalPageModule} from './edit-note/edit-note-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotesPageRoutingModule,
    EditNoteModalPageModule
  ],
  declarations: [NotesPage]
})
export class NotesPageModule {}
