import {Settings} from '../../services/settings/settings.service';

export class LoadSettings {
  public static readonly type = '[Settings] Load Settings';
  constructor(public cachedSettings?: Settings) { }
}

export class UpdateSettings {
  public static readonly type = '[Settings] Update Settings';
  constructor(public newSettings: Settings) { }
}

export class PersistSettings {
  public static readonly type = '[Settings] Persist Settings';
  constructor(public settings: Settings) { }
}
