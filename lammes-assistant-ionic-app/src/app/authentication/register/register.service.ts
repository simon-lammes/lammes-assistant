import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {AuthenticationService} from '../authentication.service';

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

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  constructor(
    private apollo: Apollo,
    private authenticationService: AuthenticationService
  ) { }

  public async register(firstName: string, lastName: string, username: string, password: string) {
    const {data} = await this.apollo.mutate<{ registration: Registration }>({
      mutation: registerMutation,
      variables: {
        firstName,
        lastName,
        username,
        password
      }
    }).toPromise();
    const {jwtToken} = data.registration;
    await this.authenticationService.storeJwtToken(jwtToken);
  }
}
