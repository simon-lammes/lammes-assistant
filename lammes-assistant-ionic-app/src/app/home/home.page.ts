import {Component} from '@angular/core';
import {map} from 'rxjs/operators';
import {Note, NoteService} from '../shared/services/note/note.service';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {SaveNoteModalPage} from '../notes/save-note/save-note-modal-page.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  noteToReview$ = this.noteService.usersPendingNotes$.pipe(
    map(pendingNotes => pendingNotes?.length > 0 ? pendingNotes[0] : undefined)
  );

  constructor(
    private noteService: NoteService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
  }

  async editNote(note: Note) {
    const modal = await this.modalController.create({
      component: SaveNoteModalPage,
      componentProps: {
        noteId: note.id
      }
    });
    return await modal.present();
  }

  async resolveNote(note: Note) {
    const apiCallPromise = this.noteService.resolveNote(note);
    const toastPromise = this.toastController.create({
      position: 'bottom',
      header: 'Note resolved',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      duration: 3000
    });
    // The api call and creation of toast can happen in parallel.
    // If one operation fails, the toast will not be shown.
    const [toast] = await Promise.all([toastPromise, apiCallPromise]);
    await toast.present();
  }

  /**
   * Delays the starting date of a note exactly by one day.
   */
  async delayForADay(note: Note) {
    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + dayInMilliseconds);
    await this.noteService.editNote({
      id: note.id,
      noteInput: {startTimestamp: tomorrow.toISOString()}
    }).toPromise();
  }

  /**
   * Delays the starting date of a note. The delay is specified by the user.
   */
  async delay(note: Note) {
    const alert = await this.alertController.create({
      header: 'Delay Note',
      inputs: [
        {
          name: 'days',
          type: 'number',
          min: 0,
          placeholder: 'Days'
        },
        {
          name: 'hours',
          type: 'number',
          min: 0,
          placeholder: 'Hours'
        },
        {
          name: 'minutes',
          type: 'number',
          min: 0,
          placeholder: 'Minutes'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delay',
          handler: async (delay: { days: string, hours: string, minutes: string }) => {
            const days = +delay.days;
            const hours = +delay.hours;
            const minutes = +delay.minutes;
            if (days < 0 || hours < 0 || minutes < 0) {
              return this.showWarning('Negative values are not allowed.');
            }
            if (days === 0 && hours === 0 && minutes === 0) {
              return this.showWarning('Delay by 0 would have no effect.');
            }
            const delayInMilliseconds =
              days * 24 * 60 * 60 * 1000
              + hours * 60 * 60 * 1000
              + minutes * 60 * 1000;
            const now = new Date();
            const delayedDate = new Date(now.getTime() + delayInMilliseconds);
            await this.noteService.editNote({
              id: note.id,
              noteInput: {startTimestamp: delayedDate.toISOString()}
            }).toPromise();
          }
        }
      ]
    });
    await alert.present();
    // I do not know a nicer way of autofocusing the first input element.
    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  private async showWarning(warning: string) {
    const toast = await this.toastController.create({
      position: 'middle',
      header: warning,
      color: 'warning',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      duration: undefined
    });
    await toast.present();
  }
}
