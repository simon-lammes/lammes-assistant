import {Component, Input, OnInit} from '@angular/core';
import {take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Note, NotesService} from '../notes.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-edit-note-modal',
  templateUrl: './edit-note-modal.page.html',
  styleUrls: ['./edit-note-modal.page.scss'],
})
export class EditNoteModalPage implements OnInit {

  @Input()
  noteId: number;

  note$: Observable<Note>;

  noteForm: FormGroup;

  constructor(
    private notesService: NotesService,
    private formBuilder: FormBuilder,
    private modalController: ModalController
  ) {
  }

  get includeStartTimestamp(): boolean {
    return this.noteForm.value.includeStartTimestamp;
  }

  get includeDeadlineTimestamp(): boolean {
    return this.noteForm.value.includeDeadlineTimestamp;
  }

  async ngOnInit() {
    this.note$ = this.notesService.fetchNote(this.noteId);
    await this.setupForm();
  }

  async saveChanges() {
    await this.notesService.editNote({
      ...this.noteForm.value,
      startTimestamp: this.includeStartTimestamp ? this.noteForm.value.startTimestamp : null
    }).toPromise();
    await this.modalController.dismiss();
  }

  /**
   * Trims the input of the user.
   */
  trim(formControlName: string) {
    const control = this.noteForm.controls[formControlName];
    control.patchValue(control.value.trim());
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  private async setupForm() {
    // We fill the form with the current notes' value but we do not update the form when the
    // note changes for whatever reason. This would confuse the user. Therefore, we take only the first value of the observable.
    const note = await this.note$.pipe(take(1)).toPromise();
    this.noteForm = this.formBuilder.group({
      id: [note.id],
      title: this.formBuilder.control(note.title, [Validators.required, Validators.min(1)]),
      description: [note.description ?? ''],
      includeStartTimestamp: this.formBuilder.control(!!note.startTimestamp),
      startTimestamp: this.formBuilder.control(note.startTimestamp),
      includeDeadlineTimestamp: this.formBuilder.control(!!note.deadlineTimestamp),
      deadlineTimestamp: this.formBuilder.control(note.deadlineTimestamp)
    });
  }
}
