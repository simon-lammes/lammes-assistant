import {NgModule, SecurityContext} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {GraphQLModule} from './graphql.module';
import {HttpClientModule} from '@angular/common/http';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {IonicStorageModule} from '@ionic/storage';
import {MarkdownModule} from 'ngx-markdown';
import {SettingsService} from './settings/settings.service';


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
    private settingsService: SettingsService
  ) {
    this.setupThemeListener();
  }

  private setupThemeListener() {
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.settingsService.currentSettings$.subscribe(settings => {
      console.log('curr settings', settings);
      const useDarkTheme = settings.theme === 'dark'
        || (settings.theme === 'system' && prefersDarkQuery.matches);
      document.body.classList.toggle('dark-theme', useDarkTheme);
    });
  }
}
