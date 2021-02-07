import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {Group, GroupMemberRole, GroupMembership, GroupService, NewGroupMembership} from '../../shared/services/group/group.service';
import {first, map, switchMap} from 'rxjs/operators';
import {UserSelectorModalComponent} from '../../shared/components/user-selector/user-selector-modal/user-selector-modal.component';
import {AlertController, ModalController} from '@ionic/angular';
import {SaveGroupComponent, SaveGroupModalInput} from '../save-group/save-group.component';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../shared/services/users/user.service';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.page.html',
  styleUrls: ['./group-detail.page.scss'],
})
export class GroupDetailPage implements OnInit {
  group$: Observable<Group>;
  myGroupMembership$: Observable<GroupMembership>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupService: GroupService,
    private modalController: ModalController,
    private alertController: AlertController,
    private translateService: TranslateService,
    private userService$: UserService
  ) {
  }

  ngOnInit() {
    this.group$ = this.activatedRoute.params.pipe(
      switchMap(params => {
        return this.groupService.fetchGroupById(+params.groupId);
      })
    );
    this.myGroupMembership$ = combineLatest([
      this.group$,
      this.userService$.currentUser$
    ]).pipe(
      map(([group, me]) => {
        return group.groupMemberships.find(x => x.user.id === me.id);
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
    if (!selectedUserIds || selectedUserIds.size === 0) {
      return;
    }
    const myRole = await this.myGroupMembership$.pipe(first()).toPromise().then(x => x.role);
    const alert = await this.alertController.create({
      header: await this.translateService.get('select-role').toPromise(),
      message: await this.translateService.get('questions.role-of-added-members').toPromise(),
      inputs: [
        {
          label: await this.translateService.get('owner').toPromise(),
          value: 'owner',
          type: 'radio',
          disabled: myRole !== 'owner'
        },
        {
          label: await this.translateService.get('admin').toPromise(),
          value: 'admin',
          type: 'radio',
          disabled: myRole !== 'owner' && myRole !== 'admin'
        },
        {
          label: await this.translateService.get('member').toPromise(),
          value: 'member',
          type: 'radio',
        }
      ],
      buttons: [
        {
          text: await this.translateService.get('cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translateService.get('save').toPromise(),
          handler: async (role: GroupMemberRole) => {
            const addedMemberships: NewGroupMembership[] = [...selectedUserIds]
              .filter(x => !currentUserIdsSet.has(x))
              .map(x => ({memberId: x}));
            await this.groupService.addGroupMemberships({
              id: group.id,
              addedMemberships,
              role
            });
          }
        }
      ]
    });
    await alert.present();
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
