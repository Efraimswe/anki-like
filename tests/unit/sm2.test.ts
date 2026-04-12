import { describe, it, expect } from 'vitest';
import { calculate, previewIntervals, Rating, type CardState } from '@/lib/sm2';

const newCardState = (): CardState => ({
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  phase: 'new',
  learningStep: 0,
});

describe('SM-2 Algorithm', () => {
  describe('learning steps (new card)', () => {
    it('should enter learning step 1 (10 min) on first review with Good', () => {
      const result = calculate(newCardState(), Rating.GOOD);
      expect(result.phase).toBe('learning');
      expect(result.learningStep).toBe(1);
      expect(result.interval).toBe(10);
    });

    it('should stay at step 0 (1 min) on Again', () => {
      const result = calculate(newCardState(), Rating.AGAIN);
      expect(result.phase).toBe('learning');
      expect(result.learningStep).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should graduate on Easy with 4-day interval', () => {
      const result = calculate(newCardState(), Rating.EASY);
      expect(result.phase).toBe('review');
      expect(result.interval).toBe(5760);
      expect(result.learningStep).toBe(0);
    });

    it('should advance to step 1 then graduate on Good', () => {
      const step1 = calculate(newCardState(), Rating.GOOD);
      expect(step1.learningStep).toBe(1);
      expect(step1.interval).toBe(10);
      expect(step1.phase).toBe('learning');

      const graduated = calculate(step1, Rating.GOOD);
      expect(graduated.phase).toBe('review');
      expect(graduated.interval).toBe(1440);
      expect(graduated.learningStep).toBe(0);
    });

    it('should reset to step 0 on Again from step 1', () => {
      const atStep1: CardState = { interval: 10, easeFactor: 2.5, repetitions: 0, phase: 'learning', learningStep: 1 };
      const result = calculate(atStep1, Rating.AGAIN);
      expect(result.learningStep).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.phase).toBe('learning');
    });

    it('should stay on current step on Hard', () => {
      const atStep0: CardState = { interval: 1, easeFactor: 2.5, repetitions: 0, phase: 'learning', learningStep: 0 };
      const result = calculate(atStep0, Rating.HARD);
      expect(result.learningStep).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('relearning steps', () => {
    it('review card rated Again enters relearning at step 0 (10 min)', () => {
      const reviewCard: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const result = calculate(reviewCard, Rating.AGAIN);
      expect(result.phase).toBe('relearning');
      expect(result.learningStep).toBe(0);
      expect(result.interval).toBe(10);
    });

    it('relearning card rated Good graduates back to review', () => {
      const relearning: CardState = { interval: 10, easeFactor: 2.5, repetitions: 0, phase: 'relearning', learningStep: 0 };
      const result = calculate(relearning, Rating.GOOD);
      expect(result.phase).toBe('review');
      expect(result.interval).toBe(1440);
    });

    it('relearning card rated Again stays in relearning at step 0', () => {
      const relearning: CardState = { interval: 10, easeFactor: 2.5, repetitions: 0, phase: 'relearning', learningStep: 0 };
      const result = calculate(relearning, Rating.AGAIN);
      expect(result.phase).toBe('relearning');
      expect(result.learningStep).toBe(0);
      expect(result.interval).toBe(10);
    });
  });

  describe('review phase (SM-2 algorithm)', () => {
    it('should multiply interval by easeFactor on Good', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const result = calculate(state, Rating.GOOD);
      expect(result.interval).toBe(Math.round(8640 * 2.5));
      expect(result.repetitions).toBe(3);
      expect(result.phase).toBe('review');
    });

    it('should apply Easy bonus (1.3x on top of easeFactor)', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const good = calculate(state, Rating.GOOD);
      const easy = calculate(state, Rating.EASY);
      expect(easy.interval).toBeGreaterThan(good.interval);
    });

    it('should use 1.2x for Hard rating', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const result = calculate(state, Rating.HARD);
      expect(result.interval).toBeGreaterThan(state.interval);
      expect(result.phase).toBe('review');
    });

    it('should cap interval at 365 days', () => {
      const state: CardState = { interval: 432000, easeFactor: 2.5, repetitions: 10, phase: 'review', learningStep: 0 };
      const result = calculate(state, Rating.GOOD);
      expect(result.interval).toBeLessThanOrEqual(365 * 1440);
    });
  });

  describe('ease factor adjustments', () => {
    it('should increase ease factor on Easy', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const result = calculate(state, Rating.EASY);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should decrease ease factor on Again', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const result = calculate(state, Rating.AGAIN);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should never go below 1.3', () => {
      const state: CardState = { interval: 1, easeFactor: 1.3, repetitions: 0, phase: 'learning', learningStep: 0 };
      const result = calculate(state, Rating.AGAIN);
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('due date calculation', () => {
    it('should set due date ~1 minute in the future for learning step 0', () => {
      const before = Date.now();
      const result = calculate(newCardState(), Rating.AGAIN);
      const after = Date.now();
      const dueMs = result.dueDate.getTime();
      expect(dueMs).toBeGreaterThanOrEqual(before + 55_000);
      expect(dueMs).toBeLessThanOrEqual(after + 65_000);
    });

    it('should set due date in days for review cards', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const before = Date.now();
      const result = calculate(state, Rating.GOOD);
      expect(result.dueDate.getTime()).toBeGreaterThan(before + 1440 * 60_000);
    });
  });

  describe('previewIntervals', () => {
    it('should return hints for all 4 ratings', () => {
      const hints = previewIntervals(newCardState());
      expect(hints.again).toBe('1m');
      expect(hints.good).toBe('10m');
      expect(hints.easy).toBe('4d');
      expect(hints).toHaveProperty('hard');
    });

    it('should return day-level hints for review cards', () => {
      const state: CardState = { interval: 8640, easeFactor: 2.5, repetitions: 2, phase: 'review', learningStep: 0 };
      const hints = previewIntervals(state);
      expect(hints.again).toBe('10m');
      expect(hints.good).toMatch(/d|mo/);
    });
  });
});
