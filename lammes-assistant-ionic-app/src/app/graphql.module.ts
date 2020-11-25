import {NgModule} from '@angular/core';
import {APOLLO_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, ApolloLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import {environment} from '../environments/environment';
import {AuthenticationService} from './authentication/authentication.service';
import {setContext} from '@apollo/client/link/context';

export function createApollo(httpLink: HttpLink, authenticationService: AuthenticationService): ApolloClientOptions<any> {
  const auth = setContext(() => ({
    headers: {
      Authorization: authenticationService.isUserAuthenticated ? `Bearer ${authenticationService.currentJwtToken}` : ''
    },
  }));
  const link = ApolloLink.from([auth, httpLink.create({uri: environment.uriGraphQl})]);
  const cache = new InMemoryCache();
  return {
    link,
    cache
  };
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink, AuthenticationService],
    },
  ],
})
export class GraphQLModule {}
