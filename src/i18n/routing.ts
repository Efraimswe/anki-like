import { defineRouting } from 'next-intl/routing';

export const LOCALES = [
  'en', 'ru', 'fr', 'es', 'de', 'zh', 'pt', 'ar', 'ja', 'ko',
  'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'uk', 'cs', 'el',
  'he', 'hi', 'sv', 'ro', 'hu', 'da', 'fi', 'no', 'sk', 'bg', 'hr',
] as const;

export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  localePrefix: 'never',
});
