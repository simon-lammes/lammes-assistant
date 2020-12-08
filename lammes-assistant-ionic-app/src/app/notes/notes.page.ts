import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';
import {ActionSheetController, AlertController} from '@ionic/angular';
import {Router} from '@angular/router';
import {ActionSheetButton} from '@ionic/core/dist/types/components/action-sheet/action-sheet-interface';

/**
 * These are the options the user can choose by clicking on a segment.
 */
type SegmentOption = 'deferred' | 'pending' | 'resolved';

/**
 * The status of a notes deadline.
 */
enum DeadlineStatus {
  NoDeadlineSpecified,
  DueSometime,
  DueSoon,
  Overdue,
}

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  deferredNotes$: Observable<Note[]>;
  pendingNotes$: Observable<Note[]>;
  resolvedNotes$: Observable<Note[]>;
  selectedSegmentOption: SegmentOption = 'pending';

  /**
   * This is member variable only exists, so that this enum can be used inside the html template.
   */
  DeadlineStatus = DeadlineStatus;

  constructor(
    private notesService: NotesService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.deferredNotes$ = this.notesService.usersDeferredNotes$;
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
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)'
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
    // I do not know a nicer way of autofocusing the first input element.
    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
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

  getDeadlineStatus(note: Note): DeadlineStatus {
    if (!note.deadlineTimestamp) {
      return DeadlineStatus.NoDeadlineSpecified;
    }
    const timeLeftInMilliseconds = new Date(note.deadlineTimestamp).getTime() - new Date().getTime();
    if (timeLeftInMilliseconds <= 0) {
      return DeadlineStatus.Overdue;
    }
    // We consider deadlines urgent that are within 24 hours.
    // This should be made configurable in the future.
    if (timeLeftInMilliseconds < 24 * 60 * 60 * 1000) {
      return DeadlineStatus.DueSoon;
    }
    return DeadlineStatus.DueSometime;
  }
}
