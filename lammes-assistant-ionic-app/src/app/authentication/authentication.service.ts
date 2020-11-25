// Line is needed because of web part of the plugin (explained here https://www.npmjs.com/package/capacitor-secure-storage-plugin)
import 'capacitor-secure-storage-plugin';
import {Plugins} from '@capacitor/core';
import {Injectable} from '@angular/core';

const {SecureStoragePlugin} = Plugins;

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
  private readonly JWT_TOKEN_KEY = 'jwt_token';
  private jwtToken = '';

  /**
   * This property is a workaround for constructors not being able to be asynchronous. This service requires asynchronous
   * initialization logic that is tracked within this promise. If you want to make sure, that this service is already
   * initialized, please await this promise. Concretely, this makes sure that this service had a chance to load jwt tokens
   * from secure storage. This promise is purposely private and should not exposed in any way. No other class should await
   * this promise or know about it because this would create unnecessary coupling.
   */
  private initialization = new Promise(async resolve => {
    await this.loadJwtTokenFromSecureStorage();
    resolve();
  });

  /**
   * Before returning an jwt token this method makes sure that this service had enough time to load a jwt token from secure storage.
   */
  async getCurrentJwtToken(): Promise<string> {
    await this.initialization;
    return this.jwtToken;
  }

  async isUserAuthenticated(): Promise<boolean> {
    const jwtToken = await this.getCurrentJwtToken();
    return jwtToken?.length > 0;
  }

  /**
   * Stores the jwt token in memory for fast access and in "secure storage" so that it can re-used
   * when the user re-visits the application and does not need to login again.
   */
  async storeJwtToken(jwtToken: string) {
    await SecureStoragePlugin.set({key: this.JWT_TOKEN_KEY, value: jwtToken});
    this.jwtToken = jwtToken;
  }

  /**
   * Use the equivalent method without 'premature' prefix whenever possible. The prefix 'premature' indicates that this
   * method might return before this service has been initialized. This method cannot await the services' initialization because
   * it is purposely not async. It only exists for situations where you cannot work with promises/async/await.
   */
  prematureIsUserAuthenticated() {
    return this.jwtToken?.length > 0;
  }

  /**
   * Use the equivalent method without 'premature' prefix whenever possible. The prefix 'premature' indicates that this
   * method might return before this service has been initialized. This method cannot await the services' initialization because
   * it is purposely not async. It only exists for situations where you cannot work with promises/async/await.
   */
  prematureGetCurrentJwtToken() {
    return this.jwtToken;
  }

  /**
   * This application saves the users jwtToken in a secure, persistent storage so that is user is still
   * authenticated when he re-visits the application. This method loads the jwtToken.
   */
  private async loadJwtTokenFromSecureStorage() {
    await SecureStoragePlugin.get({key: this.JWT_TOKEN_KEY}).then(({value}) => {
      this.jwtToken = value;
    }).catch(() => {
      // The key could not be found, which is absolutely normal when the user uses the application the first time.
      // Thus, we do not react to this event.
    });
  }
}
