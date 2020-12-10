// Line is needed because of web part of the plugin (explained here https://www.npmjs.com/package/capacitor-secure-storage-plugin)
import 'capacitor-secure-storage-plugin';
import {Plugins} from '@capacitor/core';
import {Injectable} from '@angular/core';
import {BehaviorSubject, timer} from 'rxjs';
import {debounce, filter} from 'rxjs/operators';
import jwt_decode from 'jwt-decode';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Router} from '@angular/router';
import {ToastController} from '@ionic/angular';

const {SecureStoragePlugin} = Plugins;

interface JwtPayload {
  /**
   * When the jwt token expires expressed in seconds from epoch.
   */
  exp: number;
}

/**
 * This service is only responsible for storing the authentication state, meaning it is responsible for storing and providing
 * the users tokens. You maybe would expect this service to be responsible to log users in and register them, however a faced a problem
 * with those aspects: For this service to be able to log users in or register them, it must depend on the apollo client to send
 * login or registration requests to the server. However, the apollo client must depend on this service to get the users token for
 * authentication. In order to break this circular dependency, I put login and registration functionality in separate services.
 */
@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly JWT_TOKEN_KEY = 'jwt_token';
  private jwtTokenBehaviourSubject = new BehaviorSubject('');
  jwtToken$ = this.jwtTokenBehaviourSubject.asObservable();
  /**
   * This property is a workaround for constructors not being able to be asynchronous. This service requires asynchronous
   * initialization logic that is tracked within this promise. If you want to make sure, that this service is already
   * initialized, please await this promise. Concretely, this makes sure that this service had a chance to load jwt tokens
   * from secure storage. This promise is purposely private and should not exposed in any way. No other class should await
   * this promise or know about it because this would create unnecessary coupling.
   */
  private asyncInitialization = new Promise(async resolve => {
    await this.loadJwtTokenFromSecureStorage();
    resolve(true);
  });

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {
    this.setupAutomaticLogoutWhenTokenExpires();
  }

  /**
   * Before returning an jwt token this method makes sure that this service had enough time to load a jwt token from secure storage.
   */
  async getCurrentJwtToken(): Promise<string> {
    await this.asyncInitialization;
    return this.jwtTokenBehaviourSubject.value;
  }

  async isUserAuthenticated(): Promise<boolean> {
    const jwtToken = await this.getCurrentJwtToken();
    if (!jwtToken || jwtToken.length < 0) {
      return false;
    }
    const jwtPayload = jwt_decode(jwtToken) as JwtPayload;
    const expirationDate = new Date(jwtPayload.exp * 1000);
    return expirationDate > new Date();
  }

  /**
   * Stores the jwt token in memory for fast access and in "secure storage" so that it can re-used
   * when the user re-visits the application and does not need to login again.
   */
  async storeJwtToken(jwtToken: string) {
    await SecureStoragePlugin.set({key: this.JWT_TOKEN_KEY, value: jwtToken});
    this.jwtTokenBehaviourSubject.next(jwtToken);
  }

  /**
   * Use the equivalent async method whenever possible. This sync method might return before this service has been asynchronously
   * initialized. This method cannot await the services' initialization because it is purposely not async. It only exists for situations
   * where you cannot work with promises/async/await.
   */
  getJwtTokenSync() {
    return this.jwtTokenBehaviourSubject.value;
  }

  /**
   * This method makes sure that the user is logged out and automatically redirected to the login screen when his token is expired.
   */
  private setupAutomaticLogoutWhenTokenExpires() {
    this.jwtToken$.pipe(
      // When the jwt token has a length of 0, the user is logged out anyways. Thus, we can ignore/filter out this case.
      filter(jwtToken => jwtToken?.length > 0),
      // We check when the jwt token expires and make sure this observable fires when the jwt token expires.
      // You might ask why we use debounce instead of delay. Well, suppose the user has a token that expires in 1 hour
      // but then logs out and in and now has a token that expires in 2 hours. If we used delay, this observable
      // would fire within 1 hour, redirecting the user to the login page although his token was valid for another hour.
      // With debounce, on the other hand, the timer starts anew once the user gets a new token. In this example the user
      // would be redirected within 2 hours like it is supposed to be.
      debounce(jwtToken => {
        const jwtPayload = jwt_decode(jwtToken) as JwtPayload;
        // We do want to log the user out a bit before the token expires. Otherwise he could send a request that is unauthenticated
        // once it arrives at the server. The time difference is specified in the following constant. Feel free to give it a better name.
        const safetyGapMilliseconds = 5000;
        return timer(new Date(jwtPayload.exp * 1000 - safetyGapMilliseconds));
      }),
      // Avoid memory leaks by cleaning up subscriptions.
      untilDestroyed(this)
    ).subscribe(() => {
      this.jwtTokenBehaviourSubject.next('');
      this.toastController.create({
        position: 'top',
        header: 'Token expired',
        message: 'Please log in again.',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel'
          }
        ],
        duration: undefined
      }).then(toast => {
        return toast.present();
      }).then(() => this.router.navigateByUrl('/login'));
    });
  }

  /**
   * This application saves the users jwtToken in a secure, persistent storage so that is user is still
   * authenticated when he re-visits the application. This method loads the jwtToken.
   */
  private async loadJwtTokenFromSecureStorage() {
    await SecureStoragePlugin.get({key: this.JWT_TOKEN_KEY}).then(({value}) => {
      this.jwtTokenBehaviourSubject.next(value);
    }).catch(() => {
      // The key could not be found, which is absolutely normal when the user uses the application the first time.
      // Thus, we do not react to this event.
    });
  }
}
