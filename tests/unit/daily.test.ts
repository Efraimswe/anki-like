import { describe, expect, it } from 'vitest';
import { startOfDay, endOfDay, dayKey } from '@/lib/daily';

const iso = (d: Date) => d.toISOString();

describe('startOfDay (Brussels boundary)', () => {
  it('summer (CEST, +2): day starts at 22:00 UTC the previous date', () => {
    // 2026-06-11 16:37 Brussels
    expect(iso(startOfDay(new Date('2026-06-11T14:37:12Z')))).toBe('2026-06-10T22:00:00.000Z');
  });

  it('winter (CET, +1): day starts at 23:00 UTC the previous date', () => {
    // 2026-01-15 11:00 Brussels
    expect(iso(startOfDay(new Date('2026-01-15T10:00:00Z')))).toBe('2026-01-14T23:00:00.000Z');
  });

  it('just after Brussels midnight belongs to the new day', () => {
    // 2026-06-11 00:30 Brussels == 2026-06-10 22:30 UTC
    expect(iso(startOfDay(new Date('2026-06-10T22:30:00Z')))).toBe('2026-06-10T22:00:00.000Z');
  });

  it('just before Brussels midnight still belongs to the old day', () => {
    // 2026-06-11 23:30 Brussels == 2026-06-11 21:30 UTC
    expect(iso(startOfDay(new Date('2026-06-11T21:30:00Z')))).toBe('2026-06-10T22:00:00.000Z');
  });

  it('rolls over to the next day at Brussels midnight', () => {
    // 2026-06-12 00:30 Brussels == 2026-06-11 22:30 UTC
    expect(iso(startOfDay(new Date('2026-06-11T22:30:00Z')))).toBe('2026-06-11T22:00:00.000Z');
  });
});

describe('endOfDay (exclusive upper bound = next Brussels midnight)', () => {
  it('summer: ends at 22:00 UTC (next local midnight)', () => {
    expect(iso(endOfDay(new Date('2026-06-11T14:37:12Z')))).toBe('2026-06-11T22:00:00.000Z');
  });

  it('winter: ends at 23:00 UTC (next local midnight)', () => {
    expect(iso(endOfDay(new Date('2026-01-15T10:00:00Z')))).toBe('2026-01-15T23:00:00.000Z');
  });

  it('is exactly 24h after startOfDay on a normal day', () => {
    const d = new Date('2026-06-11T14:37:12Z');
    expect(endOfDay(d).getTime() - startOfDay(d).getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe('dayKey (Brussels calendar date for the @db.Date counter)', () => {
  it('uses the Brussels calendar date, not the UTC date', () => {
    // 2026-06-11 00:30 Brussels — UTC date is still June 10, Brussels date is June 11
    expect(iso(dayKey(new Date('2026-06-10T22:30:00Z')))).toBe('2026-06-11T00:00:00.000Z');
  });

  it('late-evening Brussels (before midnight) keeps the same calendar date', () => {
    expect(iso(dayKey(new Date('2026-06-11T21:30:00Z')))).toBe('2026-06-11T00:00:00.000Z');
  });

  it('after Brussels midnight advances the calendar date', () => {
    expect(iso(dayKey(new Date('2026-06-11T22:30:00Z')))).toBe('2026-06-12T00:00:00.000Z');
  });
});
