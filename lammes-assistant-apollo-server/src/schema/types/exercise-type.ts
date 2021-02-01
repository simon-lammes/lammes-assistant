import {enumType} from "@nexus/schema";

export const ExerciseType = enumType({
  name: 'ExerciseType',
  members: ['standard', 'multiselect', 'trueOrFalse', 'ordering', 'prompt']
});
