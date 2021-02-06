import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {Group, GroupService, NewGroupMembership} from '../../shared/services/group/group.service';
import {switchMap} from 'rxjs/operators';
import {UserSelectorModalComponent} from '../../shared/components/user-selector/user-selector-modal/user-selector-modal.component';
import {ModalController} from '@ionic/angular';
import {SaveGroupComponent, SaveGroupModalInput} from '../save-group/save-group.component';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.page.html',
  styleUrls: ['./group-detail.page.scss'],
})
export class GroupDetailPage implements OnInit {
  group$: Observable<Group>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupService: GroupService,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.group$ = this.activatedRoute.params.pipe(
      switchMap(params => {
        return this.groupService.fetchGroupById(+params.id);
      })
    );
  }

  async addMembers(group: Group) {
    const currentUserIds = group.groupMemberships.map(x => x.user.id);
    const currentUserIdsSet = new Set<number>(currentUserIds);
    const modal = await this.modalController.create({
      component: UserSelectorModalComponent,
      componentProps: {
        initiallySelectedUserIds: currentUserIds,
        disabledUserIds: currentUserIdsSet
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss();
    const selectedUserIds = data?.selectedUserIds as Set<number> | undefined;
    if (selectedUserIds?.size > 0) {
      const newMemberships: NewGroupMembership[] = [...selectedUserIds]
        .filter(x => !currentUserIdsSet.has(x))
        .map(x => ({memberId: x}));
      await this.groupService.addGroupMemberships(group.id, newMemberships);
    }
  }

  async editGroup(editedGroup: Group) {
    const modal = await this.modalController.create({
      component: SaveGroupComponent,
      componentProps: {
        input: {
          editedGroupId: editedGroup.id
        } as SaveGroupModalInput
      }
    });
    await modal.present();
  }
}
