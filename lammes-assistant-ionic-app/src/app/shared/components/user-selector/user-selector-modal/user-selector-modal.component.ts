import {Component, Input, OnInit} from '@angular/core';
import {User, UserFilter, UserService} from '../../../services/users/user.service';
import {ModalController} from '@ionic/angular';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {startWith, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-user-selector-modal',
  templateUrl: './user-selector-modal.component.html',
  styleUrls: ['./user-selector-modal.component.scss'],
})
export class UserSelectorModalComponent implements OnInit {

  @Input()
  initiallySelectedUserIds: Set<number>;

  filterForm: FormGroup;
  filter$: Observable<UserFilter>;
  filteredUsers$: Observable<User[]>;
  selectedUserIds: Set<number>;

  constructor(
    private userService: UserService,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {
  }

  ngOnInit() {
    this.selectedUserIds = new Set<number>(this.initiallySelectedUserIds);
    this.filterForm = this.fb.group({
      query: this.fb.control('')
    });
    this.filter$ = this.filterForm.valueChanges.pipe(startWith(this.filterForm.value as UserFilter));
    this.filteredUsers$ = this.filter$.pipe(
      switchMap(filter => this.userService.getFilteredUsers(filter))
    );
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  onChangeUserSelection(event: CustomEvent, user: User) {
    const {detail: {checked}} = event;
    if (checked) {
      this.selectedUserIds.add(user.id);
    } else {
      this.selectedUserIds.delete(user.id);
    }
  }

  async set() {
    await this.modalController.dismiss({
      selectedUserIds: this.selectedUserIds
    });
  }
}
