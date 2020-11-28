import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';
import {ActionSheetController, AlertController} from '@ionic/angular';
import {Router} from '@angular/router';
import {ActionSheetButton} from '@ionic/core/dist/types/components/action-sheet/action-sheet-interface';

/**
 * These are the options the user can choose by clicking on a segment.
 */
type SegmentOption = 'pending' | 'resolved';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  pendingNotes$: Observable<Note[]>;
  resolvedNotes$: Observable<Note[]>;
  selectedSegmentOption: SegmentOption = 'pending';

  constructor(
    private notesService: NotesService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.pendingNotes$ = this.notesService.usersPendingNotes$;
    this.resolvedNotes$ = this.notesService.usersResolvedNotes$;
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
    // We only want a complete button, if the note has not been resolved yet.
    const completeButton: ActionSheetButton = note.resolvedTimestamp?.length > 0 ? undefined : {
      text: 'Resolve',
      icon: 'checkmark-outline',
      handler: async () => {
        await this.notesService.resolveNote(note);
      }
    };
    const actionSheet = await this.actionSheetController.create({
      header: `Note: ${note.text}`,
      buttons: [
        completeButton,
        {
          text: 'Edit',
          icon: 'create-outline',
          handler: async () => {
            await this.router.navigateByUrl(`/tabs/notes/edit-note/${note.id}`);
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
        // We might have set some buttons (e.g. the resolve button) set to undefined because we want to hide it.
        // We need to filter out those undefined values from the array.
        .filter(button => button)
    });
    await actionSheet.present();
  }

  onSegmentChange($event: any) {
    this.selectedSegmentOption = $event.detail.value;
  }
}
