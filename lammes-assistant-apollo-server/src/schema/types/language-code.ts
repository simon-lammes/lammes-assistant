import {enumType} from "@nexus/schema";

export const LanguageCodeEnumType = enumType({
  name: 'LanguageCode',
  description: 'We use ISO 639-1.',
  members: ['en', 'de']
});
