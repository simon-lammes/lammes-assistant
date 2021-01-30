import {ExerciseCooldown, ExerciseCooldownType} from "./exercise-cooldown";
import {inputObjectType, objectType} from "@nexus/schema";
import {ThemeType} from "./theme";

export interface Settings {
  settingsUpdatedTimestamp?: string;
  exerciseCooldown: ExerciseCooldown;
}


export const SettingsObjectType = inputObjectType({
  name: 'Settings',
  definition(t) {
    t.nonNull.field('exerciseCooldown', {type: ExerciseCooldownType})
    t.nonNull.field('theme', {type: ThemeType})
  },
});
