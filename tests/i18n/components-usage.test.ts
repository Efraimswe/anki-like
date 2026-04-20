import { describe, it, expect } from 'vitest';
import { scanSourceFiles, loadLocale, flatten } from './helpers';
import path from 'path';

const LOCALES = ['en','ar','bg','cs','da','de','el','es','fi','fr','he','hi','hr','hu','id','it','ja','ko','nl','no','pl','pt','ro','ru','sk','sv','th','tr','uk','vi','zh'];
const loaded = Object.fromEntries(LOCALES.map((l) => [l, flatten(loadLocale(l))]));
const usage = scanSourceFiles(path.resolve(__dirname, '../../src'));

describe('component i18n key usage', () => {
  it('has no dynamic keys without an i18n-keys override comment', () => {
    const bad = usage.filter((u) => u.hasDynamic && u.overrides.length === 0);
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });

  it.each(LOCALES)('every requested key exists in %s', (locale) => {
    const missing: string[] = [];
    for (const u of usage) {
      const allKeys = [...u.keys, ...u.overrides.map((o) => `${u.namespace}.${o}`)];
      for (const k of allKeys) {
        if (!(k in loaded[locale])) missing.push(`${u.file} → ${k}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });
});
