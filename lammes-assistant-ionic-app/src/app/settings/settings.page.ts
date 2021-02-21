import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../shared/services/authentication/authentication.service';
import {Apollo} from 'apollo-angular';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PickerController, ToastController} from '@ionic/angular';
import _ from 'lodash';
import {PickerColumn} from '@ionic/core/dist/types/components/picker/picker-interface';
import {filter, first, map, startWith} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ExerciseCooldown, Settings, SettingsService} from '../shared/services/settings/settings.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationConfigurationService} from '../shared/services/application-configuration/application-configuration.service';
import {Actions, ofActionSuccessful, Select, Store} from '@ngxs/store';
import {SettingsState} from '../shared/state/settings/settings.state';
import {PersistSettings, UpdateSettings} from '../shared/state/settings/settings.actions';

@UntilDestroy()
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  @Select(SettingsState.currentSettings) currentSettings$: Observable<Settings>;

  settingsForm: FormGroup;
  exerciseCooldownTextualRepresentation$: Observable<string>;

  constructor(
    private authenticationService: AuthenticationService,
    private apollo: Apollo,
    private router: Router,
    private fb: FormBuilder,
    private pickerController: PickerController,
    private settingsService: SettingsService,
    private toastController: ToastController,
    private translateService: TranslateService,
    private applicationConfigurationService: ApplicationConfigurationService,
    private store: Store,
    private actions: Actions
  ) {
  }

  get exerciseCooldownGroup(): FormGroup {
    return this.settingsForm.controls.exerciseCooldown as FormGroup;
  }

  async ngOnInit(): Promise<void> {
    const settings = await this.currentSettings$.pipe(
      filter(x => !!x),
      first()
    ).toPromise();
    this.settingsForm = this.fb.group({
      preferredLanguageCode: this.fb.control(settings.preferredLanguageCode),
      theme: this.fb.control(settings.theme),
      exerciseCooldown: this.fb.group({
        days: this.fb.control(settings.exerciseCooldown.days),
        hours: this.fb.control(settings.exerciseCooldown.hours),
        minutes: this.fb.control(settings.exerciseCooldown.minutes)
      }),
      exerciseCorrectStreakCap: this.fb.control(settings.exerciseCorrectStreakCap, [Validators.min(0)])
    });
    this.exerciseCooldownTextualRepresentation$ = this.exerciseCooldownGroup.valueChanges.pipe(
      // We want this observable to include the initial value.
      startWith(this.exerciseCooldownGroup.value as ExerciseCooldown),
      map(({days, hours, minutes}: ExerciseCooldown) => {
        // Create string representations for every single unit (days, hours,...)
        // Then, join them and separate them with a comma, but ignore empty values (like '0 hours' or '').
        const daysComponent = days ? `${days} days` : '';
        const hoursComponent = hours ? `${hours} hours` : '';
        const minutesComponent = minutes ? `${minutes} minutes` : '';
        const result = [daysComponent, hoursComponent, minutesComponent].filter(value => value).join(', ');
        if (result.length > 0) {
          return result;
        } else {
          return '0';
        }
      })
    );
    this.settingsForm.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(async currentSettings => {
      if (this.settingsForm.valid) {
        this.store.dispatch(new UpdateSettings(currentSettings));
      }
    });
    this.actions.pipe(
      ofActionSuccessful(PersistSettings),
      untilDestroyed(this)
    ).subscribe(async () => {
      await this.showToast(await this.translateService.get('messages.settings-saved').toPromise(), 'success');
    });
  }

  /**
   * Realizes really simple logout functionality. When the user logs out, we want that the currently stored jwt token to
   * be removed so that the user can be assured that no further requests can be made from his client device. This is important when
   * the user uses devices that are used multiple people. Furthermore, we want to reset the store/cache because data stored in
   * there is tied to the logged in user and should not be accessible in any way when the user is logged out.
   * (https://www.apollographql.com/docs/angular/recipes/authentication/#refvaset-store-on-logout)
   */
  async logout() {
    await Promise.all([
      this.authenticationService.storeJwtToken(''),
      // Clear store offers the advantage that it does not trigger refetching of queries.
      // When we log out we do not and cannot refetch queries. (https://github.com/apollographql/apollo-client/issues/2774)
      this.apollo.client.clearStore()
    ]);
    // We can only navigate to login once user is logged out. Otherwise a guard should stop this navigation from happening.
    await this.router.navigateByUrl('/login');
    // Apollo keeps it's 'cache state' although this.apollo.client.clearStore() got called.
    // This leads to some queries being stale. I have found no good solution so far.
    // My cheap trick to counteract this behaviour is to trigger a browser refresh.
    location.reload();
  }

  async changeExerciseCooldown() {
    // Method is extracted for less code duplication. I put this method inside a method instead of the class because I do not want to
    // pollute the namespace of the class.
    const createPickerOption = (unit: string, maxExclusive: number): PickerColumn => {
      return {
        name: unit,
        suffix: unit,
        selectedIndex: this.exerciseCooldownGroup.value[unit],
        options: _.range(0, maxExclusive, 1).map(value => {
          return {
            text: `${value}`,
            value,
          };
        })
      };
    };
    const picker = await this.pickerController.create({
      columns: [
        createPickerOption('days', 100),
        createPickerOption('hours', 24),
        createPickerOption('minutes', 60)
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: ({days, hours, minutes}) => {
            this.exerciseCooldownGroup.patchValue({days: days.value, hours: hours.value, minutes: minutes.value});
          }
        }
      ]
    });
    await picker.present();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      header: message,
      duration: 2500,
      color,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      position: 'top'
    });
    await toast.present();
  }
}
