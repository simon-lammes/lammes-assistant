import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

/**
 * This service is only responsible for storing the authentication state, meaning it is responsible for storing and providing
 * the users tokens. You maybe would expect this service to be responsible to log users in and register them, however a faced a problem
 * with those aspects: For this service to be able to log users in or register them, it must depend on the apollo client to send
 * login or registration requests to the server. However, the apollo client must depend on this service to get the users token for
 * authentication. In order to break this circular dependency, I put login and registration functionality in separate services.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private jwtTokenBehaviourSubject = new BehaviorSubject('');

  get currentJwtToken(): string {
    return this.jwtTokenBehaviourSubject.value;
  }

  get isUserAuthenticated(): boolean {
    return this.jwtTokenBehaviourSubject.value?.length > 0;
  }

  storeJwtToken(jwtToken: string) {
    this.jwtTokenBehaviourSubject.next(jwtToken);
  }
}
