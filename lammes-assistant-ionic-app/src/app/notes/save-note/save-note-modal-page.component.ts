import {Component, Input, OnInit} from '@angular/core';
import {take} from 'rxjs/operators';
import {NoteInput, NoteService} from '../../shared/services/note/note.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-save-note-modal',
  templateUrl: './save-note-modal-page.component.html',
  styleUrls: ['./save-note-modal-page.component.scss'],
})
export class SaveNoteModalPage implements OnInit {

  @Input()
  noteId: number | undefined;

  noteForm: FormGroup;

  constructor(
    private notesService: NoteService,
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
    const note = this.noteId
      ? await this.notesService.fetchNote(this.noteId).pipe(take(1)).toPromise()
      : undefined;
    this.noteForm = this.formBuilder.group({
      id: [note?.id],
      title: this.formBuilder.control(note?.title ?? '', [Validators.required, Validators.min(1)]),
      description: [note?.description ?? ''],
      labels: this.formBuilder.control(note?.noteLabels?.map(noteLabel => noteLabel.label.title) ?? []),
      includeStartTimestamp: this.formBuilder.control(note ? !!note.startTimestamp : true),
      startTimestamp: this.formBuilder.control(note ? note.startTimestamp : new Date().toISOString()),
      includeDeadlineTimestamp: this.formBuilder.control(!!note?.deadlineTimestamp),
      deadlineTimestamp: this.formBuilder.control(note?.deadlineTimestamp)
    });
  }

  async saveNote() {
    if (this.noteId) {
      await this.notesService.editNote({id: this.noteId, noteInput: this.getNoteInputFromForm()}).toPromise();
      await this.modalController.dismiss();
    } else {
      await this.notesService.createNote({noteInput: this.getNoteInputFromForm()});
      await this.modalController.dismiss();
    }
  }

  private getNoteInputFromForm(): NoteInput {
    const value = this.noteForm.value;
    return {
      title: value.title,
      description: value.description,
      labels: value.labels,
      startTimestamp: this.includeStartTimestamp ? value.startTimestamp : null,
      deadlineTimestamp: this.includeDeadlineTimestamp ? value.deadlineTimestamp : null
    };
  }
}
