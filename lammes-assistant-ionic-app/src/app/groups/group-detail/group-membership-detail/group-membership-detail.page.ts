import {Component, OnInit} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {Group, GroupService} from '../../../shared/services/group/group.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from '../../../shared/services/users/user.service';
import {ToastController} from '@ionic/angular';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-group-membership-detail',
  templateUrl: './group-membership-detail.page.html',
  styleUrls: ['./group-membership-detail.page.scss'],
})
export class GroupMembershipDetailPage implements OnInit {
  group$: Observable<Group>;
  member$: Observable<User>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupService: GroupService,
    private router: Router,
    private toastController: ToastController,
    private translateService: TranslateService
  ) {
  }

  ngOnInit() {
    this.group$ = this.activatedRoute.params.pipe(
      switchMap(params => {
        return this.groupService.fetchGroupById(+params.groupId);
      })
    );
    this.member$ = combineLatest([
      this.group$,
      this.activatedRoute.params
    ]).pipe(
      map(([group, params]) => {
        const memberId = +params.memberId;
        return group.groupMemberships.map(x => x.user).find(x => x.id === memberId);
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
