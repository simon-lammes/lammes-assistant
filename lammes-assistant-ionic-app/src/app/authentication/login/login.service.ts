import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {AuthenticationService} from '../authentication.service';
import {GraphQLError} from 'graphql';

const loginMutation = gql`
    mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password)
    }
`;

export enum LoginResult {
  Success,
  UserDoesNotExist,
  WrongPassword,
  UnknownError
}


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private apollo: Apollo,
    private authenticationService: AuthenticationService
  ) {
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const {data, errors} = await this.apollo.mutate<{ login?: string }>({
      mutation: loginMutation,
      errorPolicy: 'all',
      variables: {
        username,
        password
      }
    }).toPromise();
    if (data.login) {
      await this.authenticationService.storeJwtToken(data.login);
      return LoginResult.Success;
    }
    if (errors.some((e: GraphQLError) => e.extensions.code === 'NOT_FOUND')) {
      return LoginResult.UserDoesNotExist;
    }
    if (errors.some((e: GraphQLError) => e.extensions.code === 'UNAUTHENTICATED')) {
      return LoginResult.WrongPassword;
    }
    console.error(`Unknown error occurred during login.`, errors);
    return LoginResult.UnknownError;
  }
}
