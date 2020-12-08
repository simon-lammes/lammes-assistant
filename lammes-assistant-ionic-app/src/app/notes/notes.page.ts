import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';
import {AlertController} from '@ionic/angular';

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
    private alertController: AlertController
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

  async resolveNote(note: Note) {
    await this.notesService.resolveNote(note);
  }

  async reopenNote(note: Note) {
    await this.notesService.reopenNote(note);
  }
}
