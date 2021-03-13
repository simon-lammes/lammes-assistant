import {Component, Input, OnInit} from '@angular/core';
import {take} from 'rxjs/operators';
import {GroupAccess, NoteInput, NoteService} from '../../shared/services/note/note.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalController, ToastController} from '@ionic/angular';
import {TranslateService} from '@ngx-translate/core';

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
    private modalController: ModalController,
    private toastController: ToastController,
    private translateService: TranslateService
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

  async saveNote() {
    if (this.noteId) {
      await this.notesService.editNote({id: this.noteId, noteInput: await this.getNoteInputFromForm()}).toPromise();
      await Promise.all([
        this.modalController.dismiss(),
        this.showHint(await this.translateService.get('messages.note-updated').toPromise())
      ]);
    } else {
      await this.notesService.createNote({noteInput: await this.getNoteInputFromForm()});
      await Promise.all([
        this.modalController.dismiss(),
        this.showHint(await this.translateService.get('messages.note-created').toPromise())
      ]);
    }
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
      groupAccesses: this.formBuilder.control(note?.groupNotes ?? []),
      labels: this.formBuilder.control(note?.noteLabels?.map(noteLabel => noteLabel.label.title) ?? []),
      includeStartTimestamp: this.formBuilder.control(note ? !!note.startTimestamp : true),
      startTimestamp: this.formBuilder.control(note ? note.startTimestamp : new Date().toISOString()),
      includeDeadlineTimestamp: this.formBuilder.control(!!note?.deadlineTimestamp),
      deadlineTimestamp: this.formBuilder.control(note?.deadlineTimestamp)
    });
  }

  private async getNoteInputFromForm(): Promise<NoteInput> {
    const note = this.noteId
      ? await this.notesService.fetchNote(this.noteId).pipe(take(1)).toPromise()
      : undefined;
    const value = this.noteForm.value;
    const groupAccesses = value.groupAccesses as GroupAccess[];
    return {
      title: value.title,
      description: value.description,
      labels: value.labels,
      startTimestamp: this.includeStartTimestamp ? value.startTimestamp : null,
      deadlineTimestamp: this.includeDeadlineTimestamp ? value.deadlineTimestamp : null,
      addedGroupAccesses: groupAccesses
        .filter((groupAccess) => !note?.groupNotes.some(x => x.groupId === groupAccess.groupId)),
      editedGroupAccesses: groupAccesses.filter(newAccess => note?.groupNotes.some(old =>
        old.groupId === newAccess.groupId
        && old.protectionLevel !== newAccess.protectionLevel)),
      removedGroupIds: note?.groupNotes.map(x => x.groupId)
        .filter(groupId => !groupAccesses.some(access => access.groupId === groupId))
    };
  }

  private async showHint(message: string) {
    const toast = await this.toastController.create({
      header: message,
      duration: 1500,
      color: 'success',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      position: 'top'
    });
    await toast.present();
  }
}
