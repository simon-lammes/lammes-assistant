import {Component} from '@angular/core';

import {AlertController, Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SwUpdate} from '@angular/service-worker';
import {TranslateService} from '@ngx-translate/core';
import {Settings} from './shared/services/settings/settings.service';
import {Select} from '@ngxs/store';
import {SettingsState} from './shared/state/settings/settings.state';
import {Observable} from 'rxjs';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  @Select(SettingsState.settings) settings$: Observable<Settings>;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private updates: SwUpdate,
    private alertController: AlertController,
    private translateService: TranslateService
  ) {
    this.initializeApp();
    this.setupServiceWorkerListeners();
    this.setupThemeListener();
    this.setupLanguage();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  /**
   * Makes sure that updated versions of this app can be activated by the user.
   * This is necessary because I noticed the app taking a long time before activating updated versions.
   * Documentation: https://angular.io/guide/service-worker-communications
   */
  private setupServiceWorkerListeners() {
    this.updates.available.subscribe(async () => {
      const alert = await this.alertController.create({
        header: await this.translateService.get('new-version').toPromise(),
        message: await this.translateService.get('messages.new-pwa-version').toPromise(),
        buttons: [
          {
            text: await this.translateService.get('cancel').toPromise(),
            role: 'cancel'
          }, {
            text: await this.translateService.get('reload').toPromise(),
            handler: () => {
              this.updates.activateUpdate().then(() => document.location.reload());
            }
          }
        ]
      });
      await alert.present();
    });
  }

  private setupThemeListener() {
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.settings$.pipe(filter(x => !!x)).subscribe(settings => {
      const useDarkTheme = settings.theme === 'dark'
        || (settings.theme === 'system' && prefersDarkQuery.matches);
      document.body.classList.toggle('dark-theme', useDarkTheme);
    });
  }

  private setupLanguage() {
    this.translateService.setDefaultLang('en');
    this.settings$.pipe(filter(x => !!x)).subscribe(settings => {
      if (settings.preferredLanguageCode) {
        this.translateService.use(settings.preferredLanguageCode);
      }
    });
  }
}
