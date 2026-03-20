import { Sm2Service, CardState, Rating } from '../../src/reviews/sm2.service';

describe('Sm2Service', () => {
  let sm2: Sm2Service;

  beforeEach(() => {
    sm2 = new Sm2Service();
  });

  const newCardState = (): CardState => ({
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    phase: 'new',
  });

  describe('first review (new card)', () => {
    it('should set interval to 1 on Good rating', () => {
      const result = sm2.calculate(newCardState(), Rating.GOOD);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval to 1 on Again rating', () => {
      const result = sm2.calculate(newCardState(), Rating.AGAIN);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('second review (1 repetition)', () => {
    it('should set interval to 6 on Good rating', () => {
      const state: CardState = {
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        phase: 'learning',
      };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });
  });

  describe('subsequent reviews (2+ repetitions)', () => {
    it('should multiply interval by easeFactor on Good', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.interval).toBe(15); // round(6 * 2.5) = 15
      expect(result.repetitions).toBe(3);
    });

    it('should reset on Again', () => {
      const state: CardState = {
        interval: 15,
        easeFactor: 2.5,
        repetitions: 3,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('ease factor adjustments', () => {
    it('should increase ease factor on Easy', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.EASY);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should decrease ease factor on Again', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should never go below 1.3', () => {
      const state: CardState = {
        interval: 1,
        easeFactor: 1.3,
        repetitions: 0,
        phase: 'learning',
      };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.easeFactor).toBe(1.3);
    });

    it('should apply correct SM-2 formula for Good (quality=3)', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.GOOD);
      // EF' = 2.5 + (0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02))
      // EF' = 2.5 + (0.1 - 2 * (0.08 + 0.04)) = 2.5 + (0.1 - 0.24) = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36, 2);
    });
  });

  describe('interval cap', () => {
    it('should cap interval at 365 days', () => {
      const state: CardState = {
        interval: 300,
        easeFactor: 2.5,
        repetitions: 10,
        phase: 'review',
      };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.interval).toBeLessThanOrEqual(365);
    });
  });

  describe('Hard rating', () => {
    it('should increase interval less than Good', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const good = sm2.calculate(state, Rating.GOOD);
      const hard = sm2.calculate(state, Rating.HARD);
      expect(hard.interval).toBeLessThan(good.interval);
      expect(hard.interval).toBeGreaterThan(state.interval);
    });
  });

  describe('Easy rating', () => {
    it('should increase interval more than Good', () => {
      const state: CardState = {
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        phase: 'review',
      };
      const good = sm2.calculate(state, Rating.GOOD);
      const easy = sm2.calculate(state, Rating.EASY);
      expect(easy.interval).toBeGreaterThan(good.interval);
    });
  });

  describe('phase transitions', () => {
    it('new → learning on first review', () => {
      const state = newCardState();
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.phase).toBe('learning');
    });

    it('new → learning even on Again', () => {
      const state = newCardState();
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.phase).toBe('learning');
    });

    it('learning → review on Good', () => {
      const state: CardState = { interval: 1, easeFactor: 2.5, repetitions: 1, phase: 'learning' };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.phase).toBe('review');
    });

    it('learning → learning on Again', () => {
      const state: CardState = { interval: 1, easeFactor: 2.5, repetitions: 1, phase: 'learning' };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.phase).toBe('learning');
    });

    it('review → relearning on Again', () => {
      const state: CardState = { interval: 6, easeFactor: 2.5, repetitions: 2, phase: 'review' };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.phase).toBe('relearning');
    });

    it('review → review on Good', () => {
      const state: CardState = { interval: 6, easeFactor: 2.5, repetitions: 2, phase: 'review' };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.phase).toBe('review');
    });

    it('relearning → review on Good', () => {
      const state: CardState = { interval: 1, easeFactor: 2.5, repetitions: 0, phase: 'relearning' };
      const result = sm2.calculate(state, Rating.GOOD);
      expect(result.phase).toBe('review');
    });

    it('relearning → relearning on Again', () => {
      const state: CardState = { interval: 1, easeFactor: 2.5, repetitions: 0, phase: 'relearning' };
      const result = sm2.calculate(state, Rating.AGAIN);
      expect(result.phase).toBe('relearning');
    });
  });
});
