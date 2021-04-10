import {Component} from '@angular/core';
import {Note, NoteService} from '../../shared/services/note/note.service';
import {ModalController, NavParams, PopoverController} from '@ionic/angular';
import {SaveNoteModalPage} from '../save-note/save-note-modal-page.component';

export interface NotePopoverInput {
  note: Note;
}

@Component({
  selector: 'app-note-popover',
  templateUrl: './note-popover.component.html',
  styleUrls: ['./note-popover.component.scss'],
})
export class NotePopoverComponent {
  input: NotePopoverInput;

  constructor(
    private navParams: NavParams,
    private noteService: NoteService,
    private modalController: ModalController,
    private popoverController: PopoverController
  ) {
    this.input = this.navParams.data as NotePopoverInput;
  }

  async resolveNote() {
    await this.noteService.resolveNote(this.input.note);
    await this.popoverController.dismiss();
  }

  async reopenNote() {
    await this.noteService.reopenNote(this.input.note);
    await this.popoverController.dismiss();
  }

  async editNote() {
    const modal = await this.modalController.create({
      component: SaveNoteModalPage,
      componentProps: {
        noteId: this.input.note.id
      }
    });
    await modal.present();
    await this.popoverController.dismiss();
  }
}
