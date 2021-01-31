import {Component} from '@angular/core';
import {ReadFile} from 'ngx-file-helpers';
import {UsersService} from '../../shared/services/users/users.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  profilePicture$ = this.usersService.myProfilePicture$;
  hasUserNoProfilePicture$ = this.profilePicture$.pipe(
    map(profilePicture => !profilePicture)
  );

  constructor(
    private usersService: UsersService
  ) {
  }

  async setProfilePicture(event: ReadFile) {
    await this.usersService.setProfilePicture({
      content: event.content,
      name: event.name,
      type: event.type
    });
  }
}
