import {Component, Input} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {RxState} from '@rx-angular/state';
import {Group, GroupService} from '../../../services/group/group.service';
import {GroupAccess} from '../../../services/note/note.service';
import {map, withLatestFrom} from 'rxjs/operators';
import {Observable} from 'rxjs';

interface GroupAccessSelectState {
  initialGroupAccesses: GroupAccess[];
  currentGroupAccesses: GroupAccess[];
}

@Component({
  selector: 'app-group-access-select-modal',
  templateUrl: './group-access-select-modal.component.html',
  styleUrls: ['./group-access-select-modal.component.scss'],
  providers: [RxState]
})
export class GroupAccessSelectModalComponent {
  selectionOptions$: Observable<{ group: Group, protectionLevel: string }[]> = this.state.select('currentGroupAccesses').pipe(
    withLatestFrom(this.groupService.myGroups$),
    map(([groupAccesses, groups]) => {
      return groups.map(group => ({
        group,
        protectionLevel: groupAccesses.find(access => access.groupId === group.id)?.protectionLevel
      }));
    })
  );

  constructor(
    private modalController: ModalController,
    private state: RxState<GroupAccessSelectState>,
    private groupService: GroupService
  ) {
  }

  @Input()
  set initialGroupAccessSelection(initialGroupAccesses: GroupAccess[]) {
    this.state.set({
      initialGroupAccesses,
      currentGroupAccesses: initialGroupAccesses
    });
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  areChangesPresent() {
    const old = this.state.get().initialGroupAccesses;
    const current = this.state.get().currentGroupAccesses;
    return old.length !== current.length
      || !old.every(oldAccess => current.find(currentAccess =>
        currentAccess.groupId === oldAccess.groupId
        && currentAccess.protectionLevel === oldAccess.protectionLevel));
  }

  async set() {
    await this.modalController.dismiss(this.state.get().currentGroupAccesses);
  }

  onChange(event: CustomEvent, groupId: number) {
    const {detail} = event;
    const protectionLevel = detail.value;
    let current = this.state.get().currentGroupAccesses.filter(x => x.groupId !== groupId);
    if (protectionLevel) {
      current = [...current, {groupId, protectionLevel}];
    }
    this.state.set({
      currentGroupAccesses: current
    });
  }
}
