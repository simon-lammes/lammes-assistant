import {enumType, inputObjectType} from "@nexus/schema";

export const ThemeType = enumType({
  name: 'Theme',
  members: ['system', 'dark', 'light']
})
