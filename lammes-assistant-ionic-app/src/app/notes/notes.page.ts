import {Component, OnInit} from '@angular/core';
import {Note, NoteFilter, NoteService} from '../shared/services/note/note.service';
import {Observable, of} from 'rxjs';
import {SaveNoteModalPage} from './save-note/save-note-modal-page.component';
import {AlertController, ModalController} from '@ionic/angular';
import {FormBuilder, FormGroup} from '@angular/forms';
import {filter, startWith, switchMap} from 'rxjs/operators';
import {debounceFilterQuery} from '../shared/operators/debounce-filter-query';
import {ApplicationConfigurationService} from '../shared/services/application-configuration/application-configuration.service';

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

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  filterForm: FormGroup;
  currentValidFilter$: Observable<NoteFilter>;
  filteredNotes$: Observable<Note[]>;

  /**
   * This is member variable only exists, so that this enum can be used inside the html template.
   */
  UrgencyStatus = UrgencyStatus;

  constructor(
    private noteService: NoteService,
    private applicationConfigurationService: ApplicationConfigurationService,
    private alertController: AlertController,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {
  }

  ngOnInit() {
    this.filteredNotes$ = of([]);
    this.filterForm = this.fb.group({
      labels: this.fb.control([]),
      noteStatus: this.fb.control(['pending'])
    });
    this.currentValidFilter$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value as NoteFilter),
      filter(() => this.filterForm.valid)
    );
    this.filteredNotes$ = this.currentValidFilter$.pipe(
      debounceFilterQuery(this.applicationConfigurationService.applicationConfiguration$),
      switchMap(currentFilter => this.noteService.fetchFilteredNotes(currentFilter))
    );
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
