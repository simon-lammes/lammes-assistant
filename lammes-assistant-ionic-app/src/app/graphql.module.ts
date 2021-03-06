import {NgModule} from '@angular/core';
import {APOLLO_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, ApolloLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import {environment} from '../environments/environment';
import {AuthenticationService} from './shared/services/authentication/authentication.service';
import {setContext} from '@apollo/client/link/context';

export function createApollo(httpLink: HttpLink, authenticationService: AuthenticationService): ApolloClientOptions<any> {
  const auth = setContext(async () => {
    const jwtToken = await authenticationService.getCurrentJwtToken();
    return {
      headers: {
        Authorization: jwtToken ? `Bearer ${jwtToken}` : ''
      },
    };
  });
  const link = ApolloLink.from([auth, httpLink.create({uri: environment.uriGraphQl})]);
  const cache = new InMemoryCache({
    typePolicies: {
      GroupMembership: {
        // This entity has a composed primary key that we need for caching.
        keyFields: ['groupId', 'memberId']
      },
      Query: {
        fields: {
          myDeferredNotes: {
            // We explicitly want to throw away the existing cache because in some cases we want to delete entries.
            // The incoming value should be the new source of truth. BTW, it worked before but by coding this explicitly,
            // we avoid getting a warning from apollo that we might lose data.
            merge: (existing, incoming) => {
              return incoming;
            }
          },
          myPendingNotes: {
            // We explicitly want to throw away the existing cache because in some cases we want to delete entries.
            // The incoming value should be the new source of truth. BTW, it worked before but by coding this explicitly,
            // we avoid getting a warning from apollo that we might lose data.
            merge: (existing, incoming) => {
              return incoming;
            }
          }
        }
      }
    }
  });
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
export class GraphQLModule {
}
