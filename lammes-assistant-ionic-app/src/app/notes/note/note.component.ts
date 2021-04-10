import {Component, Input} from '@angular/core';
import {Note} from '../../shared/services/note/note.service';
import {PopoverController} from '@ionic/angular';
import {NotePopoverComponent, NotePopoverInput} from '../note-popover/note-popover.component';

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
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
})
export class NoteComponent {
  @Input()
  note: Note;

  /**
   * This is member variable only exists, so that this enum can be used inside the html template.
   */
  UrgencyStatus = UrgencyStatus;

  constructor(
    private popoverController: PopoverController
  ) {
  }

  getUrgencyStatus(): UrgencyStatus {
    if (this.note.resolvedTimestamp) {
      return UrgencyStatus.Resolved;
    }

    // Test for the most urgent cases first and move on to less urgent cases.
    const startTime = this.note.startTimestamp ? new Date(this.note.startTimestamp) : undefined;
    const deadline = this.note.deadlineTimestamp ? new Date(this.note.deadlineTimestamp) : undefined;
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
    if (this.note.deadlineTimestamp) {
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

  async showPopover(event: MouseEvent, note: Note) {
    const popover = await this.popoverController.create({
      component: NotePopoverComponent,
      componentProps: {note} as NotePopoverInput,
      event,
      translucent: true
    });
    return await popover.present();
  }
}
