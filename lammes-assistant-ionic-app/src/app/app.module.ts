import {NgModule, SecurityContext} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {GraphQLModule} from './graphql.module';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {IonicStorageModule} from '@ionic/storage';
import {MarkdownModule} from 'ngx-markdown';
import {SettingsService} from './settings/settings.service';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    MarkdownModule.forRoot({
      // This is the default, but I write it explicitly to show that this setting is important for security against XXS attacks.
      sanitize: SecurityContext.HTML
    }),
    AppRoutingModule,
    GraphQLModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => {
          return new TranslateHttpLoader(http, './assets/i18n/', '.json');
        },
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    private settingsService: SettingsService,
    private translateService: TranslateService
  ) {
    this.setupThemeListener();
    this.setupLanguageListener();
  }

  private setupThemeListener() {
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.settingsService.currentSettings$.subscribe(settings => {
      const useDarkTheme = settings.theme === 'dark'
        || (settings.theme === 'system' && prefersDarkQuery.matches);
      document.body.classList.toggle('dark-theme', useDarkTheme);
    });
  }

  private setupLanguageListener() {
    this.settingsService.currentSettings$.subscribe(settings => {
      if (settings.preferredLanguageCode) {
        this.translateService.use(settings.preferredLanguageCode);
      }
    });
  }
}
