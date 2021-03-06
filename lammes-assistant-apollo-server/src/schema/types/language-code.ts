import {enumType} from "@nexus/schema";

export type LanguageCode = 'en' | 'de';

export const LanguageCodeEnumType = enumType({
  name: 'LanguageCode',
  description: 'We use ISO 639-1.',
  members: ['en', 'de']
});
