import {Component, OnInit} from '@angular/core';
import {CreateNoteData, Note, NotesService} from './notes.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {AlertController} from '@ionic/angular';
import {debounceTime, filter, switchMap, tap} from 'rxjs/operators';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ErrorHandlingService} from '../shared/error-handling.service';

@UntilDestroy()
@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  pendingNotes$: Observable<Note[]>;

  /**
   * Keeps track about which notes have been checked off by the user.
   */
  checkedOffNoteIdsBehaviourSubject = new BehaviorSubject<number[]>([]);

  /**
   * Keeps track about which notes have been checked off by the user.
   */
  checkedOffNoteIds$ = this.checkedOffNoteIdsBehaviourSubject.asObservable();

  /**
   * When the user checks off items, he might have done it by accident which is why we do not want to immediately save this change.
   * Thus, we debounce this change. The debounce time specifies how long we wait till we persist those changes. Example: The user checks
   * off the ids with the ids 1, 2, 3. After checking off the note with id 3, the user does not check on or off any note for as long as the
   * debounce time. Then and only then, we persist that the user checked off notes 1, 2 and 3.
   */
  private readonly CHECK_OFF_DEBOUNCE_MILLISECONDS = 1000;

  constructor(
    private notesService: NotesService,
    private alertController: AlertController,
    private errorHandlingService: ErrorHandlingService
  ) {
  }


  ngOnInit() {
    this.pendingNotes$ = this.notesService.usersNotes$;
    this.setupCheckingOffSubscription();
  }

  async createNote() {
    const alert = await this.alertController.create({
      header: 'Create Note',
      inputs: [
        {
          name: 'text',
          type: 'text',
          placeholder: 'Note text'
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
  }

  /**
   * Updates the state in which we track which notes have been checked off by the user.
   */
  onNoteCheckedChanged($event: any, id: number) {
    const checkedOff: boolean = $event.detail.checked;
    let checkedOffNoteIds = this.checkedOffNoteIdsBehaviourSubject.value;
    // Either add or remove the id, depending on whether it was checked off or checked on.
    if (checkedOff) {
      checkedOffNoteIds.push(id);
    } else {
      checkedOffNoteIds = checkedOffNoteIds.filter(x => x !== id);
    }
    this.checkedOffNoteIdsBehaviourSubject.next(checkedOffNoteIds);
  }

  /**
   * This method should be called only once upon initialization. It sets up an subscription that will make sure that
   * when the user checks off notes that these changes will eventually be persisted on the server.
   */
  private setupCheckingOffSubscription() {
    this.checkedOffNoteIds$.pipe(
      debounceTime(this.CHECK_OFF_DEBOUNCE_MILLISECONDS),
      // We only need to perform the subsequent actions when the user has checked off at least 1 note.
      filter(checkedOffNoteIds => checkedOffNoteIds.length > 0),
      switchMap(checkedOffNoteIds => this.notesService.checkOffNotes(checkedOffNoteIds)),
      // All notes have been checked off. We need to update represent this change in our behaviour subject.
      tap(() => {
        // The if check is defensive programming. I assume that the condition is always true.
        // But if the current value of the behaviour subject was an empty array and we call next with another empty array,
        // we could trigger this observable over and over again, introducing an endless loop.
        if (this.checkedOffNoteIdsBehaviourSubject.value.length > 0) {
          this.checkedOffNoteIdsBehaviourSubject.next([]);
        }
      }),
      this.errorHandlingService.defaultRetryStrategy(),
      untilDestroyed(this)
    ).subscribe();
  }
}
