import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { createNewStoredState, getIntervalHints, scheduleReview, toFsrsHistory } from '@/lib/fsrs';
import { materializeFsrsState } from '@/lib/fsrs-migration';

describe('FSRS scheduling', () => {
  it('returns Anki-style short-term hints for a new card', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const hints = getIntervalHints(createNewStoredState(now), now);

    expect(hints.again).toBe('1m');
    expect(hints.good).toBe('10m');
    expect(hints.easy).toBe('8d');
  });

  it('graduates a card into review after two Good ratings', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const first = scheduleReview(createNewStoredState(createdAt), Rating.Good, createdAt);
    expect(first.phase).toBe('learning');

    const secondReviewTime = new Date('2026-01-01T00:10:00Z');
    const second = scheduleReview(first, Rating.Good, secondReviewTime);
    expect(second.phase).toBe('review');
    expect(second.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('can materialize FSRS state from historic review logs', () => {
    const now = new Date('2026-01-03T00:10:00Z');
    const state = materializeFsrsState({
      current: {
        interval: 0,
        dueDate: now,
        stability: 0,
        difficulty: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        learningStep: 0,
        phase: 'review',
        lastReview: null,
      },
      reviewLogs: [
        { rating: 3, reviewedAt: new Date('2026-01-01T00:00:00Z') },
        { rating: 3, reviewedAt: new Date('2026-01-01T00:10:00Z') },
        { rating: 3, reviewedAt: new Date('2026-01-03T00:10:00Z') },
      ],
      now,
    });

    expect(state.phase).toBe('review');
    expect(state.stability).toBeGreaterThan(0);
    expect(state.difficulty).toBeGreaterThan(0);
  });

  it('maps stored review history into FSRS input history', () => {
    const history = toFsrsHistory([
      { rating: 3, reviewedAt: new Date('2026-01-02T00:00:00Z') },
      { rating: 0, reviewedAt: new Date('2026-01-01T00:00:00Z') },
    ]);

    expect(history).toHaveLength(2);
    expect(history[0].review).toEqual(new Date('2026-01-01T00:00:00Z'));
  });
});
