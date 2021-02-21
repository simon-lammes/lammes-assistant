import {Action, Actions, NgxsOnInit, ofActionDispatched, Selector, State, StateContext} from '@ngxs/store';
import {LoadSettings, PersistSettings, UpdateSettings} from './settings.actions';
import {Settings, SettingsService} from '../../services/settings/settings.service';
import {Injectable} from '@angular/core';
import {first, map, tap} from 'rxjs/operators';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {debounceAutomaticSave} from '../../operators/debounce-automatic-save';
import {ApplicationConfigurationService} from '../../services/application-configuration/application-configuration.service';
import {distinctUntilChangedDeeply} from '../../operators/distinct-until-changed-deeply';

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
    private applicationConfigurationService: ApplicationConfigurationService,
    private actions: Actions
  ) {
  }

  @Selector()
  public static currentSettings(state: SettingsStateModel) {
    return state.settings;
  }

  ngxsOnInit(ctx?: StateContext<any>): any {
    ctx.dispatch(new LoadSettings());
    this.setupAutomaticSave(ctx);
  }

  @Action(LoadSettings)
  public load(ctx: StateContext<SettingsStateModel>) {
    return this.settingsService.currentSettings$.pipe(
      first(),
      tap(settings => {
        ctx.patchState({
          settings
        });
      })
    );
  }

  @Action(UpdateSettings)
  public update(ctx: StateContext<SettingsStateModel>, {newSettings}: UpdateSettings) {
    ctx.patchState({
      settings: newSettings
    });
  }

  @Action(PersistSettings)
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
