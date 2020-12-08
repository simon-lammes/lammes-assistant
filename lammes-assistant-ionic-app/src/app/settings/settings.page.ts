import {Component} from '@angular/core';
import {AuthenticationService} from '../authentication/authentication.service';
import {Apollo} from 'apollo-angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {

  constructor(
    private authenticationService: AuthenticationService,
    private apollo: Apollo,
    private router: Router
  ) {
  }

  /**
   * Realizes really simple logout functionality. When the user logs out, we want that the currently stored jwt token to
   * be removed so that the user can be assured that no further requests can be made from his client device. This is important when
   * the user uses devices that are used multiple people. Furthermore, we want to reset the store/cache because data stored in
   * there is tied to the logged in user and should not be accessible in any way when the user is logged out.
   * (https://www.apollographql.com/docs/angular/recipes/authentication/#reset-store-on-logout)
   */
  async logout() {
    await Promise.all([
      this.authenticationService.storeJwtToken(''),
      // Clear store offers the advantage that it does not trigger refetching of queries.
      // When we log out we do not and cannot refetch queries. (https://github.com/apollographql/apollo-client/issues/2774)
      this.apollo.client.clearStore()
    ]);
    // We can only navigate to login once user is logged out. Otherwise a guard should stop this navigation from happening.
    await this.router.navigateByUrl('/login');
  }
}
