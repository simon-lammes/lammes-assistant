import {Component, OnInit} from '@angular/core';
import {Note, NoteService} from '../shared/services/note/note.service';
import {Observable} from 'rxjs';
import {SaveNoteModalPage} from './save-note/save-note-modal-page.component';
import {AlertController, ModalController} from '@ionic/angular';

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
    private notesService: NoteService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
  }

  ngOnInit() {
    this.deferredNotes$ = this.notesService.usersDeferredNotes$;
    this.pendingNotes$ = this.notesService.usersPendingNotes$;
    this.resolvedNotes$ = this.notesService.usersResolvedNotes$;
  }

  async createNote() {
    const modal = await this.modalController.create({
      component: SaveNoteModalPage,
      componentProps: {
        noteId: undefined
      }
    });
    await modal.present();
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

  async deleteNote(note: Note) {
    await this.notesService.deleteNote(note);
  }

  async editNote(note: Note) {
    const modal = await this.modalController.create({
      component: SaveNoteModalPage,
      componentProps: {
        noteId: note.id
      }
    });
    await modal.present();
  }
}
