import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';
import {ActionSheetController, AlertController} from '@ionic/angular';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  pendingNotes$: Observable<Note[]>;

  constructor(
    private notesService: NotesService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
  ) {
  }

  ngOnInit() {
    this.pendingNotes$ = this.notesService.usersNotes$;
  }

  async createNote() {
    const alert = await this.alertController.create({
      header: 'Create Note',
      inputs: [
        {
          name: 'text',
          type: 'text',
          placeholder: 'Note text'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (result: CreateNoteData) => {
            this.notesService.createNote(result);
          }
        }
      ]
    });
    await alert.present();
  }

  async onNoteClicked(note: Note) {
    const actionSheet = await this.actionSheetController.create({
      header: `Note: ${note.text}`,
      buttons: [
        {
          text: 'Complete',
          icon: 'checkmark-outline',
          handler: async () => {
            await this.notesService.checkOffNotes([note.id]);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
          }
        }
      ]
    });
    await actionSheet.present();
  }
}
