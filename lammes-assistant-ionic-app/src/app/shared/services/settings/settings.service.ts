import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {HttpClient} from '@angular/common/http';
import {Storage} from '@ionic/storage';
import {first, map, switchMap} from 'rxjs/operators';
import {User, userFragment, UserService} from '../users/user.service';
import {ApplicationConfigurationService} from '../application-configuration/application-configuration.service';
import {combineLatest, Observable} from 'rxjs';


export interface ExerciseCooldown {
  days: number;
  hours: number;
  minutes: number;
}

export interface Settings {

  /**
   * The timestamp should be created server-side.
   */
  settingsUpdatedTimestamp?: string;
  exerciseCooldown: ExerciseCooldown;
  exerciseCorrectStreakCap?: number;
  theme: 'system' | 'dark' | 'light';
  preferredLanguageCode: string;
  applicationVolume: number;
}

const saveSettingsMutation = gql`
  mutation SaveSettingsMutation($settings: SettingsInput!) {
    saveSettings(settings: $settings) {
      ...UserFragment
    }
  },
  ${userFragment}
`;

const getSettingsDownloadLinkQuery = gql`
  query GetSettingsDownloadLinkQuery {
    getSettingsDownloadLink
  }
`;

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private storage: Storage,
    private userService: UserService,
    private applicationConfigurationService: ApplicationConfigurationService
  ) {
  }

  saveSettings(settings: Settings): Observable<any> {
    return this.apollo.mutate<{ saveSettings: User }>({
      mutation: saveSettingsMutation,
      variables: {settings}
    });
  }

  /**
   * Gets the correct settings that should be applied.
   * Those are the users settings (if available) hydrated
   * with some default values.
   * @param cachedSettings the settings that were already in cache; those are used as fallback
   */
  getSettings(cachedSettings?: Settings): Observable<Settings> {
    return combineLatest([
      this.applicationConfigurationService.defaultSettings$,
      this.userService.currentUser$
    ]).pipe(
      first(),
      switchMap(async ([defaultSettings, user]) => {
        const settings = await this.getUsersSettings(user);
        // We include the default settings because the settings might be outdated and missing new properties.
        return {
          ...defaultSettings,
          ...cachedSettings,
          ...settings
        };
      })
    );
  }

  private async cacheSettings(user: User, settings: Settings) {
    const cacheKey = `user.${user.id}.settings`;
    await this.storage.set(cacheKey, {
      ...settings,
    } as Settings);
  }

  private retrieveCachedSettings(user: { id: number }): Promise<Settings | undefined> {
    if (!user) {
      return undefined;
    }
    const cacheKey = `user.${user.id}.settings`;
    return this.storage.get(cacheKey) as Promise<Settings>;
  }

  private getSettingsDownloadLink() {
    return this.apollo.query<{ getSettingsDownloadLink: string }>({
      // As the download link is only short-lived (meaning it expires), we should not use a cache.
      // If we used a cache, we might end up using an expired download link.
      fetchPolicy: 'no-cache',
      query: getSettingsDownloadLinkQuery,
    }).pipe(
      map(({data}) => data.getSettingsDownloadLink)
    ).toPromise();
  }

  /**
   * @param user null if no user is logged in
   */
  private async getUsersSettings(user: User) {
    const cachedSettings = await this.retrieveCachedSettings(user);
    const isCacheFresh = cachedSettings?.settingsUpdatedTimestamp
      && new Date(cachedSettings.settingsUpdatedTimestamp).getTime() === new Date(user.settingsUpdatedTimestamp).getTime();
    if (!user) {
      return undefined;
    } else if (isCacheFresh) {
      return cachedSettings;
    } else {
      const downloadLink = await this.getSettingsDownloadLink();
      if (downloadLink) {
        const settings = await this.http.get<Settings>(downloadLink).toPromise();
        await this.cacheSettings(user, settings);
        return settings;
      } else {
        return undefined;
      }
    }
  }
}
