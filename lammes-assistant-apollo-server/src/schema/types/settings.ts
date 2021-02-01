import {ExerciseCooldown, ExerciseCooldownInputType, ExerciseCooldownType} from "./exercise-cooldown";
import {inputObjectType, objectType} from "@nexus/schema";
import {ThemeType} from "./theme";

export interface Settings {

  /**
   * The timestamp should be created server-side.
   */
  settingsUpdatedTimestamp?: string;
  exerciseCooldown: ExerciseCooldown;
  exerciseCorrectStreakCap?: number;
  theme: 'system' | 'dark' | 'light';
}


export const SettingsInputType = inputObjectType({
  name: 'SettingsInput',
  definition(t) {
    t.nonNull.field('exerciseCooldown', {type: ExerciseCooldownInputType});
    t.nullable.int('exerciseCorrectStreakCap');
    t.nonNull.field('theme', {type: ThemeType});
    t.nullable.field('preferredLanguageCode', {
      type: 'LanguageCode',
      description: 'If null, the system default will be used.'
    });
  },
});

export const SettingsObjectType = objectType({
  name: 'Settings',
  definition(t) {
    t.nonNull.field('exerciseCooldown', {type: ExerciseCooldownType});
    t.nonNull.field('theme', {type: ThemeType});
    t.nullable.field('preferredLanguageCode', {
      type: 'LanguageCode',
      description: 'If null, the system default will be used.'
    });
  },
});
