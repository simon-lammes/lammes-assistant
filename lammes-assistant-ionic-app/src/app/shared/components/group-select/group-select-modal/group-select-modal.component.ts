import {Component, Input, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Observable} from 'rxjs';
import {Group, GroupService} from '../../../services/group/group.service';
import _ from 'lodash';

@Component({
  selector: 'app-group-select-modal',
  templateUrl: './group-select-modal.component.html',
  styleUrls: ['./group-select-modal.component.scss'],
})
export class GroupSelectModalComponent implements OnInit {
  @Input()
  initiallySelectedGroupIds: Set<number>;

  allDisplayedGroups$: Observable<Group[]>;
  selectedGroupIds: Set<number>;

  constructor(
    private modalController: ModalController,
    private groupService: GroupService
  ) {
  }

  ngOnInit() {
    this.allDisplayedGroups$ = this.groupService.myGroups$;
    this.selectedGroupIds = new Set<number>(this.initiallySelectedGroupIds);
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  async set() {
    await this.modalController.dismiss(this.selectedGroupIds);
  }

  onChangeGroupSelection(event: CustomEvent, group: Group) {
    const {detail: {checked}} = event;
    if (checked) {
      this.selectedGroupIds.add(group.id);
    } else {
      this.selectedGroupIds.delete(group.id);
    }
  }

  areChangesPresent() {
    return !_.isEqual(this.initiallySelectedGroupIds, this.selectedGroupIds);
  }
}
