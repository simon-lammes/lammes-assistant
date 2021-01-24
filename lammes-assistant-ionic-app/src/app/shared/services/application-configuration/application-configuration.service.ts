import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';

export interface ApplicationConfiguration {
  minPasswordLength: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationConfigurationService {

  applicationConfiguration$ = this.apollo.watchQuery<{currentApplicationConfiguration: ApplicationConfiguration}>({
    query: gql`
      query CurrentApplicationConfiguration {
        currentApplicationConfiguration {
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
}
