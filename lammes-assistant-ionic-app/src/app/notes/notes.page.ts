import {Component, OnInit} from '@angular/core';
import {Note, NoteFilter, NoteService} from '../shared/services/note/note.service';
import {Observable} from 'rxjs';
import {SaveNoteModalPage} from './save-note/save-note-modal-page.component';
import {AlertController, ModalController} from '@ionic/angular';
import {FormBuilder, FormGroup} from '@angular/forms';
import {filter, startWith} from 'rxjs/operators';
import {ApplicationConfigurationService} from '../shared/services/application-configuration/application-configuration.service';
import {Select, Store} from '@ngxs/store';
import {NoteState} from '../shared/state/notes/note.state';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {FetchFilteredNotes} from '../shared/state/notes/notes.actions';

/**
 * The status of a notes deadline.
 */
enum UrgencyStatus {
  Deferred,
  NoStartTimeOrDeadline,
  DueSometime,
  DueSoon,
  Overdue,
  ReadyToStart,
  Resolved
}

@UntilDestroy()
@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  filterForm: FormGroup;
  currentValidFilter$: Observable<NoteFilter>;
  @Select(NoteState.filteredNotes) filteredNotes$: Observable<Note[]>;
  @Select(NoteState.isLoading) isLoading$: Observable<Note[]>;

  /**
   * This is member variable only exists, so that this enum can be used inside the html template.
   */
  UrgencyStatus = UrgencyStatus;

  constructor(
    private noteService: NoteService,
    private applicationConfigurationService: ApplicationConfigurationService,
    private alertController: AlertController,
    private modalController: ModalController,
    private fb: FormBuilder,
    private store: Store
  ) {
  }

  ngOnInit() {
    this.filterForm = this.fb.group({
      groupIds: this.fb.control([]),
      labels: this.fb.control([]),
      noteStatus: this.fb.control(['pending'])
    });
    this.currentValidFilter$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value as NoteFilter),
      filter(() => this.filterForm.valid)
    );
    this.currentValidFilter$.pipe(
      untilDestroyed(this)
    ).subscribe(noteFilter => this.store.dispatch(new FetchFilteredNotes(noteFilter)));
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

  getUrgencyStatus(note: Note): UrgencyStatus {
    if (note.resolvedTimestamp) {
      return UrgencyStatus.Resolved;
    }

    // Test for the most urgent cases first and move on to less urgent cases.
    const startTime = note.startTimestamp ? new Date(note.startTimestamp) : undefined;
    const deadline = note.deadlineTimestamp ? new Date(note.deadlineTimestamp) : undefined;
    const now = new Date();
    const timeLeftInMilliseconds = deadline ? deadline.getTime() - now.getTime() : undefined;
    if (timeLeftInMilliseconds && timeLeftInMilliseconds < 0) {
      return UrgencyStatus.Overdue;
    }
    // We consider deadlines urgent that are within 24 hours.
    // This should be made configurable in the future.
    if (timeLeftInMilliseconds && timeLeftInMilliseconds < 24 * 60 * 60 * 1000) {
      return UrgencyStatus.DueSoon;
    }
    if (note.deadlineTimestamp) {
      return UrgencyStatus.DueSometime;
    } else if (startTime) {
      if (startTime.getTime() < now.getTime()) {
        return UrgencyStatus.ReadyToStart;
      } else {
        return UrgencyStatus.Deferred;
      }
    } else {
      return UrgencyStatus.NoStartTimeOrDeadline;
    }
  }

  async resolveNote(note: Note) {
    await this.noteService.resolveNote(note);
  }

  async reopenNote(note: Note) {
    await this.noteService.reopenNote(note);
  }

  async deleteNote(note: Note) {
    await this.noteService.deleteNote(note);
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
