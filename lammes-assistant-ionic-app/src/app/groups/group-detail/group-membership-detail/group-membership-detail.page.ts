import {Component, OnInit} from '@angular/core';
import {first, map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {Group, GroupMemberRole, GroupMembership, GroupService} from '../../../shared/services/group/group.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User, UserService} from '../../../shared/services/users/user.service';
import {ToastController} from '@ionic/angular';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

/**
 * Describes how two members relate to each other in terms of their role. Simply: Whether one has a higher rank than the other.
 */
enum HierarchyRelationship {
  Self,
  Superior,
  NotSuperior,
}

const rolesInOrder: GroupMemberRole[] = ['owner', 'admin', 'member'];

@UntilDestroy()
@Component({
  selector: 'app-group-membership-detail',
  templateUrl: './group-membership-detail.page.html',
  styleUrls: ['./group-membership-detail.page.scss'],
})
export class GroupMembershipDetailPage implements OnInit {
  HierarchyRelationship = HierarchyRelationship;
  membershipForm: FormGroup;
  groupId$: Observable<number>;
  memberId$: Observable<number>;
  group$: Observable<Group>;
  member$: Observable<User>;
  groupMembership$: Observable<GroupMembership>;
  myGroupMembership$: Observable<GroupMembership>;
  hierarchyRelationship$: Observable<HierarchyRelationship>;
  allowedOptionsForRoleControl$: Observable<GroupMemberRole[]>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupService: GroupService,
    private router: Router,
    private toastController: ToastController,
    private translateService: TranslateService,
    private fb: FormBuilder,
    private userService: UserService
  ) {
  }

  ngOnInit() {
    this.groupId$ = this.activatedRoute.params.pipe(map(x => +x.groupId));
    this.memberId$ = this.activatedRoute.params.pipe(map(x => +x.memberId));
    this.group$ = this.groupId$.pipe(
      switchMap(groupId => {
        return this.groupService.fetchGroupById(groupId);
      })
    );
    this.member$ = combineLatest([
      this.group$,
      this.memberId$,
    ]).pipe(
      map(([group, memberId]) => {
        return group.groupMemberships.map(x => x.user).find(x => x.id === memberId);
      })
    );
    this.groupMembership$ = combineLatest([
      this.group$,
      this.memberId$,
    ]).pipe(
      map(([group, memberId]) => {
        return group.groupMemberships.find(x => x.user.id === memberId);
      })
    );
    this.groupMembership$.pipe(untilDestroyed(this)).subscribe(groupMembership => {
      this.membershipForm = this.fb.group({
        role: this.fb.control(groupMembership.role)
      });
    });
    this.myGroupMembership$ = combineLatest([
      this.group$,
      this.userService.currentUser$
    ]).pipe(
      map(([group, me]) => {
        return group.groupMemberships.find(x => x.user.id === me.id);
      })
    );
    this.hierarchyRelationship$ = combineLatest([
      this.groupMembership$,
      this.myGroupMembership$
    ]).pipe(
      map(([otherMembership, myMembership]) => {
        if (otherMembership.user.id === myMembership.user.id) {
          return HierarchyRelationship.Self;
        }
        return rolesInOrder.indexOf(myMembership.role) < rolesInOrder.indexOf(otherMembership.role)
          ? HierarchyRelationship.Superior
          : HierarchyRelationship.NotSuperior;
      })
    );
    this.allowedOptionsForRoleControl$ = combineLatest([
      this.groupMembership$,
      this.myGroupMembership$
    ]).pipe(
      map(([otherMembership, myMembership]) => {
        if (otherMembership.user.id === myMembership.user.id) {
          return [];
        }
        const myRole = myMembership.role;
        const otherRole = otherMembership.role;
        if (otherRole === 'owner') {
          return [];
        }
        if (rolesInOrder.indexOf(myRole) >= rolesInOrder.indexOf(otherRole)) {
          return [];
        }
        if (myRole === 'member') {
          return [];
        }
        return rolesInOrder.slice(rolesInOrder.indexOf(myRole));
      })
    );
  }

  async removeMember(member: User) {
    await this.groupService.removeGroupMemberships(+this.activatedRoute.snapshot.params.groupId, [member.id]);
    const toastPromise = this.showHint(await this.translateService.get('messages.member-removed').toPromise(), 'success', 1500);
    const navigationPromise = this.navigateBack();
    await Promise.all([toastPromise, navigationPromise]);
  }

  async navigateBack() {
    await this.router.navigate(['/tabs/home/groups/', this.activatedRoute.snapshot.params.groupId]);
  }

  async save() {
    await this.groupService.editGroupMembership({
      groupId: await this.groupId$.pipe(first()).toPromise(),
      memberId: await this.memberId$.pipe(first()).toPromise(),
      role: this.membershipForm.value.role
    });
    await this.navigateBack();
  }

  private async showHint(message: string, color = 'primary', duration?: number) {
    const toast = await this.toastController.create({
      header: message,
      color,
      duration,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      position: 'top'
    });
    await toast.present();
  }
}
