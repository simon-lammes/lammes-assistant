import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';
import {AlertController} from '@ionic/angular';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  notes$: Observable<Note[]>;

  constructor(
    private notesService: NotesService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.notes$ = this.notesService.usersNotes$;
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
}
