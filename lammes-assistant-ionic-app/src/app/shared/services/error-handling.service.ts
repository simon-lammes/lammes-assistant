import {Injectable} from '@angular/core';
import {delay, retryWhen, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {ToastController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  constructor(
    private toastController: ToastController
  ) { }

  /**
   * The goal of this method is that it can be used anywhere in this application where an observable might might fail and we want to retry.
   * For example, this is suitable for network errors, because the next request might get through.
   */
  defaultRetryStrategy() {
    return retryWhen(errors$ => {
      return errors$.pipe(
        tap(async (errors) => {
          console.error(errors);
          const toast = await this.toastController.create({
            message: `An error occurred. We will retry within ${environment.networkRetryDelayMilliseconds / 1000} seconds`,
            duration: environment.networkRetryDelayMilliseconds,
            position: 'top'
          });
          await toast.present();
        }),
        delay(environment.networkRetryDelayMilliseconds)
      );
    });
  }
}
