import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {NotesPageRoutingModule} from './notes-routing.module';

import {NotesPage} from './notes.page';
import {SaveNoteModalPageModule} from './save-note/save-note-modal.module';
import {SharedModule} from '../shared/shared.module';
import {NoteComponent} from './note/note.component';
import {EnrichedMarkdownModule} from '../shared/components/enriched-markdown/enriched-markdown.module';
import {NotePopoverComponent} from './note-popover/note-popover.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotesPageRoutingModule,
    SaveNoteModalPageModule,
    SharedModule,
    ReactiveFormsModule,
    EnrichedMarkdownModule
  ],
  declarations: [
    NotesPage,
    NoteComponent,
    NotePopoverComponent
  ]
})
export class NotesPageModule {
}
