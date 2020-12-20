import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {HttpClient} from '@angular/common/http';
import {Storage} from '@ionic/storage';
import {distinctUntilChanged, map, shareReplay, switchMap} from 'rxjs/operators';
import _ from 'lodash';

export interface User {
  id: number;
  settingsUpdatedTimestamp: string;
}

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
}

const saveSettingsMutation = gql`
  mutation SaveSettingsMutation($exerciseCooldown: ExerciseCooldown!) {
    saveSettings(exerciseCooldown: $exerciseCooldown) {
      id,
      settingsUpdatedTimestamp
    }
  }
`;

const getCurrentUserQuery = gql`
  query GetCurrentUserQuery {
    me {
      id,
      settingsUpdatedTimestamp
    }
  }
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

  readonly currentUser$ = this.apollo.watchQuery<{ me: User }>({query: getCurrentUserQuery})
    .valueChanges.pipe(
      map(({data}) => data.me)
    );

  readonly currentSettings$ = this.currentUser$.pipe(
    switchMap(async user => {
      const cachedSettings = await this.retrieveCachedSettings(user);
      const isCacheFresh = cachedSettings?.settingsUpdatedTimestamp
        && new Date(cachedSettings.settingsUpdatedTimestamp).getTime() === new Date(user.settingsUpdatedTimestamp).getTime();
      if (isCacheFresh) {
        return cachedSettings;
      } else {
        const downloadLink = await this.getSettingsDownloadLink();
        const settings = await this.http.get<Settings>(downloadLink).toPromise();
        await this.cacheSettings(user, settings);
        return settings;
      }
    }),
    // We do not need to check cache for every new subscription. (performance)
    shareReplay(1)
  );

  /**
   * Exposes the property "exerciseCooldown" of the current user's settings. But the advantage of this observable,
   * is that it only emits (again) when the user changes the exercise cooldown. If the user changes something other than
   * the exercise cooldown, this observable does not emit a new value.
   */
  readonly exerciseCooldown$ = this.currentSettings$.pipe(
    map(settings => settings.exerciseCooldown),
    distinctUntilChanged((x, y) => _.isEqual(x, y))
  );

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private storage: Storage
  ) {
  }

  async saveSettings(settings: Settings): Promise<any> {
    await this.apollo.mutate<{ saveSettings: User }>({
      mutation: saveSettingsMutation,
      variables: settings
    }).toPromise();
  }

  private async cacheSettings(user: User, settings: Settings) {
    const cacheKey = `user.${user.id}.settings`;
    await this.storage.set(cacheKey, {
      ...settings,
    } as Settings);
  }

  private retrieveCachedSettings(user: User): Promise<Settings | undefined> {
    const cacheKey = `user.${user.id}.settings`;
    return this.storage.get(cacheKey) as Promise<Settings>;
  }

  private getSettingsDownloadLink() {
    return this.apollo.query<{getSettingsDownloadLink: string}>({
      // As the download link is only short-lived (meaning it expires), we should not use a cache.
      // If we used a cache, we might end up using an expired download link.
      fetchPolicy: 'no-cache',
      query: getSettingsDownloadLinkQuery,
    }).pipe(
      map(({data}) => data.getSettingsDownloadLink)
    ).toPromise();
  }
}
