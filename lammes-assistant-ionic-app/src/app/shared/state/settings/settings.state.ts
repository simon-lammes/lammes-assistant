import {Action, Actions, NgxsOnInit, ofActionDispatched, Selector, State, StateContext} from '@ngxs/store';
import {LoadSettings, PersistSettings, UpdateSettings} from './settings.actions';
import {Settings, SettingsService} from '../../services/settings/settings.service';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {debounceAutomaticSave} from '../../operators/debounce-automatic-save';
import {ApplicationConfigurationService} from '../../services/application-configuration/application-configuration.service';
import {distinctUntilChangedDeeply} from '../../operators/distinct-until-changed-deeply';
import {AuthenticationService} from '../../services/authentication/authentication.service';
import {UserService} from '../../services/users/user.service';

export interface SettingsStateModel {
  settings: Settings;
}

@State<SettingsStateModel>({
  name: 'settings',
  defaults: {
    settings: null
  }
})
@Injectable()
@UntilDestroy()
export class SettingsState implements NgxsOnInit {

  constructor(
    private settingsService: SettingsService,
    private authenticationService: AuthenticationService,
    private applicationConfigurationService: ApplicationConfigurationService,
    private actions: Actions,
    private userService: UserService
  ) {
  }

  @Selector()
  public static settings(state: SettingsStateModel) {
    return state.settings;
  }

  @Selector([SettingsState.settings])
  public static exerciseCooldown(settings: Settings) {
    return settings?.exerciseCooldown;
  }

  @Selector([SettingsState.settings])
  public static applicationVolume(settings: Settings) {
    return settings?.applicationVolume;
  }

  ngxsOnInit(ctx?: StateContext<SettingsStateModel>): any {
    const cachedSettings = ctx.getState().settings;
    // Whenever the user changes, we need to load the "new" settings.
    this.userService.currentUser$.pipe(untilDestroyed(this)).subscribe(() =>
      ctx.dispatch(new LoadSettings(cachedSettings)));
    this.setupAutomaticSave(ctx);
  }

  @Action(LoadSettings)
  public load(ctx: StateContext<SettingsStateModel>, {cachedSettings}: LoadSettings) {
    this.settingsService.getSettings(cachedSettings).then(settings => {
      ctx.patchState({
        settings
      });
    });
  }

  @Action(UpdateSettings)
  public update(ctx: StateContext<SettingsStateModel>, {newSettings}: UpdateSettings) {
    ctx.patchState({
      settings: newSettings
    });
  }

  @Action(PersistSettings, {cancelUncompleted: true})
  public persist(ctx: StateContext<SettingsStateModel>, {settings}: PersistSettings) {
    return this.settingsService.saveSettings(settings);
  }

  private setupAutomaticSave(ctx: StateContext<any>) {
    this.actions.pipe(
      ofActionDispatched(UpdateSettings),
      map((action: UpdateSettings) => action.newSettings),
      debounceAutomaticSave(this.applicationConfigurationService.applicationConfiguration$),
      distinctUntilChangedDeeply(),
      untilDestroyed(this)
    ).subscribe(async settings => {
      ctx.dispatch(new PersistSettings(settings));
    });
  }
}
