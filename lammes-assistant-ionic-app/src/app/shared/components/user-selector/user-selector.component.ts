import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {UserSelectorModalComponent} from './user-selector-modal/user-selector-modal.component';
import {User, UserService} from '../../services/users/user.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChangedDeeply} from '../../operators/distinct-until-changed-deeply';
import {switchMap} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => UserSelectorComponent)
    }
  ]
})
export class UserSelectorComponent implements ControlValueAccessor, OnInit {
  @Input()
  heading: string;
  /**
   * This text is displayed when no labels are selected.
   */
  @Input()
  noSelectionText = '';
  isDisabled = false;
  currentValueSubject = new BehaviorSubject(new Set<number>());
  currentValue$ = this.currentValueSubject.asObservable();
  selectedUsers$: Observable<User[]>;
  private onTouched: () => void;

  constructor(
    private modalController: ModalController,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {
    this.selectedUsers$ = this.currentValue$.pipe(
      switchMap(userIds => {
        if (userIds.size === 0) {
          of([]);
        }
        return this.userService.getFilteredUsers({userIds: [...userIds]});
      })
    );
  }

  writeValue(obj: any): void {
    this.currentValueSubject.next(new Set(obj));
  }

  registerOnChange(fn: any): void {
    this.currentValue$.pipe(
      untilDestroyed(this),
      distinctUntilChangedDeeply(),
    ).subscribe(value => {
      fn([...value]);
    });
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  async openUserSelectorModal() {
    const modal = await this.modalController.create({
      component: UserSelectorModalComponent,
      componentProps: {
        initiallySelectedUserIds: this.currentValueSubject.value
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss();
    if (!data) {
      return;
    }
    const {selectedUserIds} = data;
    if (!selectedUserIds) {
      return;
    }
    this.currentValueSubject.next(selectedUserIds);
  }
}
