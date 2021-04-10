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
}
