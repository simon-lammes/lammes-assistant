import {Component, OnInit} from '@angular/core';
import {SaveGroupComponent, SaveGroupModalInput} from './save-group/save-group.component';
import {ModalController} from '@ionic/angular';
import {Group, GroupService} from '../shared/services/group/group.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
})
export class GroupsPage implements OnInit {
  myGroups$ = this.groupService.myGroups$;

  constructor(
    private modalController: ModalController,
    private groupService: GroupService
  ) {
  }

  ngOnInit() {
  }

  async createGroup() {
    const modal = await this.modalController.create({
      component: SaveGroupComponent
    });
    await modal.present();
  }

  async editGroup(editedGroup: Group) {
    const modal = await this.modalController.create({
      component: SaveGroupComponent,
      componentProps: {
        input: {
          editedGroup
        } as SaveGroupModalInput
      }
    });
    await modal.present();
  }
}
