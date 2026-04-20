const RTL_LOCALES = new Set(['ar', 'he']);

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}
