import { describe, it, expect } from 'vitest';
import { loadLocale, flatten, extractPlaceholders } from './helpers';

const LOCALES = ['ar','bg','cs','da','de','el','es','fi','fr','he','hi','hr','hu','id','it','ja','ko','nl','no','pl','pt','ro','ru','sk','sv','th','tr','uk','vi','zh'];
const en = flatten(loadLocale('en'));

describe.each(LOCALES)('locale %s', (locale) => {
  const messages = flatten(loadLocale(locale));

  it('has the same keys as en', () => {
    expect(new Set(Object.keys(messages))).toEqual(new Set(Object.keys(en)));
  });

  it('has no empty values or key-as-value', () => {
    for (const [key, value] of Object.entries(messages)) {
      expect(value, `${locale}:${key}`).not.toBe('');
      expect(value, `${locale}:${key}`).not.toBe(key);
    }
  });

  it('has matching ICU placeholders for every key', () => {
    for (const key of Object.keys(en)) {
      const enPh = extractPlaceholders(en[key]);
      const locPh = extractPlaceholders(messages[key]);
      expect(locPh, `${locale}:${key}`).toEqual(enPh);
    }
  });

  it('has valid ICU syntax for every value', () => {
    for (const [key, value] of Object.entries(messages)) {
      expect(() => extractPlaceholders(value), `${locale}:${key}`).not.toThrow();
    }
  });
});
