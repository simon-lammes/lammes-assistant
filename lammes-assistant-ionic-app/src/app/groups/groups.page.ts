import {Component} from '@angular/core';
import {SaveGroupComponent} from './save-group/save-group.component';
import {ModalController} from '@ionic/angular';
import {GroupService} from '../shared/services/group/group.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
})
export class GroupsPage {
  myGroups$ = this.groupService.myGroups$;

  constructor(
    private modalController: ModalController,
    private groupService: GroupService
  ) {
  }

  async createGroup() {
    const modal = await this.modalController.create({
      component: SaveGroupComponent
    });
    await modal.present();
  }
}
