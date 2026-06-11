import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { isDueForReview, countDueForReview } from '@/lib/due';
import { createNewStoredState, scheduleReview } from '@/lib/fsrs';
import { addMinutes } from '@/lib/clock';

const now = new Date('2026-01-10T08:00:00Z');
const ms = (d: string) => new Date(d);

describe('isDueForReview', () => {
  it('counts an overdue (previous-day) card as due', () => {
    expect(isDueForReview({ phase: 'review', dueDate: ms('2026-01-08T08:00:00Z') }, now)).toBe(true);
  });

  it('counts a card due exactly now as due', () => {
    expect(isDueForReview({ phase: 'review', dueDate: now }, now)).toBe(true);
  });

  it('counts a review card due LATER today as due (available from local midnight)', () => {
    // now is 09:00 Brussels; this card is stamped for 21:00 Brussels the same day.
    expect(isDueForReview({ phase: 'review', dueDate: ms('2026-01-10T20:00:00Z') }, now)).toBe(true);
  });

  it('does NOT count a review card due on a future calendar day', () => {
    expect(isDueForReview({ phase: 'review', dueDate: ms('2026-01-11T08:00:00Z') }, now)).toBe(false);
  });

  it('does NOT count a learning card due later today (minute precision kept)', () => {
    expect(isDueForReview({ phase: 'learning', dueDate: ms('2026-01-10T20:00:00Z') }, now)).toBe(false);
  });

  it('does NOT count a brand-new card (never studied) as "to review"', () => {
    expect(isDueForReview({ phase: 'new', dueDate: ms('2026-01-01T00:00:00Z') }, now)).toBe(false);
  });

  it('counts an overdue learning card as due', () => {
    expect(isDueForReview({ phase: 'learning', dueDate: ms('2026-01-09T08:00:00Z') }, now)).toBe(true);
  });

  it('treats a missing card state as not due', () => {
    expect(isDueForReview(null, now)).toBe(false);
  });
});

describe('countDueForReview', () => {
  it('counts only due, non-new cards', () => {
    const states = [
      { phase: 'review', dueDate: ms('2026-01-08T08:00:00Z') }, // overdue -> due
      { phase: 'review', dueDate: ms('2026-01-10T08:00:00Z') }, // due now -> due
      { phase: 'review', dueDate: ms('2026-01-20T08:00:00Z') }, // future -> not
      { phase: 'new', dueDate: ms('2026-01-01T00:00:00Z') }, // new -> not
      null, // missing -> not
    ];
    expect(countDueForReview(states, now)).toBe(2);
  });
});

describe('missed-day regression (real FSRS scheduling)', () => {
  it('still counts a card as due after its due day was skipped', () => {
    const day0 = new Date('2026-01-01T08:00:00Z');
    const first = scheduleReview(createNewStoredState(day0), Rating.Good, day0);
    const graduated = scheduleReview(first, Rating.Good, addMinutes(day0, 10));
    expect(graduated.phase).toBe('review');

    // Open the app a full day AFTER the card was due (the missed-day scenario).
    const afterMissedDay = new Date(graduated.dueDate.getTime() + 24 * 60 * 60 * 1000);
    expect(isDueForReview(graduated, afterMissedDay)).toBe(true);
  });
});
