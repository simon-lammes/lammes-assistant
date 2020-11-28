import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Note, NotesService} from '../notes.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-edit-note',
  templateUrl: './edit-note.page.html',
  styleUrls: ['./edit-note.page.scss'],
})
export class EditNotePage implements OnInit {
  noteId$: Observable<number>;
  note$: Observable<Note>;
  noteForm: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private notesService: NotesService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
  }

  async ngOnInit() {
    this.noteId$ = this.activatedRoute.paramMap.pipe(map(value => +value.get('noteId')));
    this.note$ = this.noteId$.pipe(switchMap(noteId => this.notesService.fetchNote(noteId)));
    await this.setupForm();
  }

  async saveChanges() {
    await this.notesService.editNote(this.noteForm.value).toPromise();
    await this.router.navigateByUrl('/tabs/notes');
  }

  private async setupForm() {
    // We fill the form with the current notes' value but we do not update the form when the
    // note changes for whatever reason. This would confuse the user. Therefore, we take only the first value of the observable.
    const note = await this.note$.pipe(take(1)).toPromise();
    this.noteForm = this.formBuilder.group({
      id: [note.id],
      text: this.formBuilder.control(note.text, [Validators.required, Validators.min(1)]),
      description: ['']
    });
  }

  /**
   * Trims the input of the user.
   */
  trim(formControlName: string) {
    const control = this.noteForm.controls[formControlName];
    control.patchValue(control.value.trim());
  }
}
