import {Component} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SettingsService} from './shared/services/settings/settings.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private settingsService: SettingsService,
    private translateService: TranslateService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.setupLanguage();
      this.setupThemeListener();
    });
  }

  private setupThemeListener() {
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.settingsService.currentSettings$.subscribe(settings => {
      const useDarkTheme = settings.theme === 'dark'
        || (settings.theme === 'system' && prefersDarkQuery.matches);
      document.body.classList.toggle('dark-theme', useDarkTheme);
    });
  }

  private setupLanguage() {
    this.translateService.setDefaultLang('en');
    this.settingsService.currentSettings$.subscribe(settings => {
      if (settings.preferredLanguageCode) {
        this.translateService.use(settings.preferredLanguageCode);
      }
    });
  }
}
