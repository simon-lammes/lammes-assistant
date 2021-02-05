import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {NotesPageRoutingModule} from './notes-routing.module';

import {NotesPage} from './notes.page';
import {SaveNoteModalPageModule} from './save-note/save-note-modal.module';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotesPageRoutingModule,
    SaveNoteModalPageModule,
    SharedModule,
    ReactiveFormsModule
  ],
  declarations: [NotesPage]
})
export class NotesPageModule {}
