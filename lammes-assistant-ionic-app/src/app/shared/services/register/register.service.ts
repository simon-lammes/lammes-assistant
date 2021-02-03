import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {AuthenticationService} from '../authentication/authentication.service';
import {GraphQLError} from 'graphql';

const registerMutation = gql`
    mutation registration($firstName: String!, $lastName: String!, $username: String!, $password: String!) {
        register(firstName: $firstName, lastName: $lastName, username: $username, password: $password) {
            jwtToken
        }
    }
`;

interface Registration {
  jwtToken: string;
  user?: any;
}

export enum RegistrationResult {
  Success,
  UsernameAlreadyUsed,
  UnknownError
}


@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  constructor(
    private apollo: Apollo,
    private authenticationService: AuthenticationService
  ) { }

  public async register(firstName: string, lastName: string, username: string, password: string): Promise<RegistrationResult> {
    const {data, errors} = await this.apollo.mutate<{ register: Registration }>({
      mutation: registerMutation,
      errorPolicy: 'all',
      variables: {
        firstName,
        lastName,
        username,
        password
      }
    }).toPromise();
    if (data.register) {
      const {jwtToken} = data.register;
      await this.authenticationService.storeJwtToken(jwtToken);
      return RegistrationResult.Success;
    }
    if (errors.some((e: GraphQLError) => e.extensions.code === 'CONFLICT')) {
      return RegistrationResult.UsernameAlreadyUsed;
    }
    console.error(`Unknown error occurred during registration.`, errors);
    return RegistrationResult.UnknownError;
  }
}
