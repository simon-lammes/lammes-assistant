import {ExerciseCooldown} from "./exercise-cooldown";

export interface Settings {
  settingsUpdatedTimestamp?: string;
  exerciseCooldown: ExerciseCooldown;
}
