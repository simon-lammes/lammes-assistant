import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {first, map} from 'rxjs/operators';

export interface ApplicationConfiguration {
  minPasswordLength: number;
  allowedFileTypes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationConfigurationService {

  applicationConfiguration$ = this.apollo.watchQuery<{currentApplicationConfiguration: ApplicationConfiguration}>({
    query: gql`
      query CurrentApplicationConfiguration {
        currentApplicationConfiguration {
          allowedFileTypes,
          minPasswordLength
        }
      }
    `
  }).valueChanges.pipe(
    map(result => result.data.currentApplicationConfiguration)
  );

  constructor(
    private apollo: Apollo
  ) { }

  getApplicationConfigurationSnapshot() {
    return this.applicationConfiguration$.pipe(first()).toPromise();
  }
}
