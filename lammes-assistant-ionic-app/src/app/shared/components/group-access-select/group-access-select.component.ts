import {ChangeDetectionStrategy, Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {RxState} from '@rx-angular/state';
import {map, tap} from 'rxjs/operators';
import {GroupAccessSelectModalComponent} from './group-access-select-modal/group-access-select-modal.component';
import {Group, GroupService} from '../../services/group/group.service';
import {combineLatest, Observable} from 'rxjs';
import {GroupAccess} from '../../services/note/note.service';

interface GroupAccessSelectState {
  initialGroupAccesses: GroupAccess[];
  currentGroupAccesses: GroupAccess[];
}

@Component({
  selector: 'app-group-access-select',
  templateUrl: './group-access-select.component.html',
  styleUrls: ['./group-access-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => GroupAccessSelectComponent)
    },
    RxState
  ]
})
export class GroupAccessSelectComponent implements ControlValueAccessor {
  @Input()
  label: string;

  currentSelections$: Observable<{ group: Group, access: GroupAccess }[]> = combineLatest([
    this.state.select('currentGroupAccesses'),
    this.groupService.myGroups$
  ]).pipe(
    map(([groupAccesses, groups]) => {
      return groups
        .filter(group => groupAccesses.some(groupAccess => groupAccess.groupId === group.id))
        .map(group => {
          return {
            group,
            access: groupAccesses.find(access => access.groupId === group.id)
          };
        });
    })
  );

  constructor(
    private modalController: ModalController,
    private state: RxState<GroupAccessSelectState>,
    private groupService: GroupService
  ) {
  }

  registerOnChange(fn: any): void {
    this.state.hold(
      this.state.select('currentGroupAccesses').pipe(
        tap(x => {
          fn(x);
        })
      )
    );
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(obj: any): void {
    this.state.set({
      initialGroupAccesses: obj,
      currentGroupAccesses: obj
    });
  }

  async openGroupSelectModal() {
    const modal = await this.modalController.create({
      component: GroupAccessSelectModalComponent,
      componentProps: {
        initialGroupAccessSelection: this.state.get().currentGroupAccesses
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss() as { data: GroupAccess[] };
    if (data) {
      this.state.set({currentGroupAccesses: data});
    }
  }
}
