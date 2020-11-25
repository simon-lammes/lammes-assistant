import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {AuthenticationService} from '../authentication.service';

const loginMutation = gql`
    mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password)
    }
`;


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private apollo: Apollo,
    private authenticationService: AuthenticationService
  ) { }

  async login(username: string, password: string) {
    const {data} = await this.apollo.mutate<{ login: string }>({
      mutation: loginMutation,
      variables: {
        username,
        password
      }
    }).toPromise();
    await this.authenticationService.storeJwtToken(data.login);
  }
}
