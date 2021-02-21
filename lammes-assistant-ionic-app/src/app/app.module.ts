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
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgxsModule} from '@ngxs/store';
import {SettingsState} from './shared/state/settings/settings.state';
import {IonicStorageEngine} from './shared/ionic-storage-engine';
import {NgxsAsyncStoragePluginModule} from '@ngxs-labs/async-storage-plugin';

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
    }),
    NgxsModule.forRoot([SettingsState], {
      developmentMode: !environment.production,
      selectorOptions: {
        // This will be the default in NGXS 4.x.
        injectContainerState: false
      }
    }),
    NgxsAsyncStoragePluginModule.forRoot(IonicStorageEngine, {
      key: [SettingsState]
    })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
  }
}
