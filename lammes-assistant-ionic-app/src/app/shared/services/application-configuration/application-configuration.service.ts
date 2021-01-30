import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {distinctUntilChanged, first, map} from 'rxjs/operators';
import _ from 'lodash';
import {Settings} from '../../../settings/settings.service';

export interface ApplicationConfiguration {
  minPasswordLength: number;
  allowedFileTypes: string[];
  defaultSettings: Settings;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationConfigurationService {

  applicationConfiguration$ = this.apollo.watchQuery<{ currentApplicationConfiguration: ApplicationConfiguration }>({
    query: gql`
      query CurrentApplicationConfiguration {
        currentApplicationConfiguration {
          allowedFileTypes,
          minPasswordLength,
          defaultSettings {
            theme,
            exerciseCooldown {
              days,
              hours,
              minutes
            }
          }
        }
      }
    `
  }).valueChanges.pipe(
    map(result => result.data.currentApplicationConfiguration)
  );

  defaultSettings$ = this.applicationConfiguration$.pipe(
    map(config => config.defaultSettings),
    distinctUntilChanged((x, y) => _.isEqual(x, y))
  );

  constructor(
    private apollo: Apollo
  ) {
  }

  getApplicationConfigurationSnapshot() {
    return this.applicationConfiguration$.pipe(first()).toPromise();
  }
}
