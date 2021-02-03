import {Component} from '@angular/core';
import {ReadFile} from 'ngx-file-helpers';
import {UserService} from '../../shared/services/users/user.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  profilePicture$ = this.userService.myProfilePicture$;
  hasUserNoProfilePicture$ = this.profilePicture$.pipe(
    map(profilePicture => !profilePicture)
  );

  constructor(
    private userService: UserService
  ) {
  }

  async setProfilePicture(event: ReadFile) {
    await this.userService.setProfilePicture({
      content: event.content,
      name: event.name,
      type: event.type
    });
  }
}
