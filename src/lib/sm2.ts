import { formatInterval } from './interval-format';

export enum Rating {
  AGAIN = 0,
  HARD = 2,
  GOOD = 3,
  EASY = 5,
}

export interface CardState {
  interval: number; // in minutes (1440 = 1 day)
  easeFactor: number;
  repetitions: number;
  phase: 'new' | 'learning' | 'review' | 'relearning';
  learningStep: number;
}

export interface Sm2Result extends CardState {
  dueDate: Date;
}

export interface IntervalHints {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

// Learning steps config (in minutes)
const NEW_STEPS = [1, 10];
const RELEARNING_STEPS = [10];
const GRADUATING_INTERVAL = 1440; // 1 day in minutes
const EASY_GRADUATING_INTERVAL = 5760; // 4 days in minutes
const MAX_INTERVAL = 365 * 1440; // 365 days in minutes

export function calculate(state: CardState, rating: Rating): Sm2Result {
  const { phase } = state;

  if (phase === 'new' || phase === 'learning' || phase === 'relearning') {
    return calculateLearning(state, rating);
  }

  return calculateReview(state, rating);
}

function calculateLearning(state: CardState, rating: Rating): Sm2Result {
  const steps = state.phase === 'relearning' ? RELEARNING_STEPS : NEW_STEPS;
  let { easeFactor, learningStep } = state;

  const quality = rating as number;
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  if (rating === Rating.AGAIN) {
    learningStep = 0;
    const interval = steps[0];
    const dueDate = new Date();
    dueDate.setTime(dueDate.getTime() + interval * 60_000);
    return {
      interval,
      easeFactor,
      repetitions: 0,
      phase: state.phase === 'new' ? 'learning' : state.phase,
      learningStep,
      dueDate,
    };
  }

  if (rating === Rating.EASY) {
    const dueDate = new Date();
    dueDate.setTime(dueDate.getTime() + EASY_GRADUATING_INTERVAL * 60_000);
    return {
      interval: EASY_GRADUATING_INTERVAL,
      easeFactor,
      repetitions: 1,
      phase: 'review',
      learningStep: 0,
      dueDate,
    };
  }

  if (rating === Rating.HARD) {
    const interval = steps[Math.min(learningStep, steps.length - 1)];
    const dueDate = new Date();
    dueDate.setTime(dueDate.getTime() + interval * 60_000);
    return {
      interval,
      easeFactor,
      repetitions: 0,
      phase: state.phase === 'new' ? 'learning' : state.phase,
      learningStep,
      dueDate,
    };
  }

  // Good: advance to next step or graduate
  const nextStep = learningStep + 1;
  if (nextStep >= steps.length) {
    const dueDate = new Date();
    dueDate.setTime(dueDate.getTime() + GRADUATING_INTERVAL * 60_000);
    return {
      interval: GRADUATING_INTERVAL,
      easeFactor,
      repetitions: 1,
      phase: 'review',
      learningStep: 0,
      dueDate,
    };
  }

  const interval = steps[nextStep];
  const dueDate = new Date();
  dueDate.setTime(dueDate.getTime() + interval * 60_000);
  return {
    interval,
    easeFactor,
    repetitions: 0,
    phase: state.phase === 'new' ? 'learning' : state.phase,
    learningStep: nextStep,
    dueDate,
  };
}

function calculateReview(state: CardState, rating: Rating): Sm2Result {
  const quality = rating as number;
  let { interval, easeFactor, repetitions } = state;

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  if (rating === Rating.AGAIN) {
    const relearningInterval = RELEARNING_STEPS[0];
    const dueDate = new Date();
    dueDate.setTime(dueDate.getTime() + relearningInterval * 60_000);
    return {
      interval: relearningInterval,
      easeFactor: newEaseFactor,
      repetitions: 0,
      phase: 'relearning',
      learningStep: 0,
      dueDate,
    };
  }

  if (rating === Rating.HARD) {
    interval = Math.max(interval + 1440, Math.round(interval * 1.2));
    repetitions += 1;
  } else {
    if (repetitions <= 1) {
      interval = 6 * 1440;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  if (rating === Rating.EASY) {
    interval = Math.round(interval * 1.3);
  }

  interval = Math.min(interval, MAX_INTERVAL);

  const dueDate = new Date();
  dueDate.setTime(dueDate.getTime() + interval * 60_000);

  return {
    interval,
    easeFactor: newEaseFactor,
    repetitions,
    phase: 'review',
    learningStep: 0,
    dueDate,
  };
}

export function previewIntervals(state: CardState): IntervalHints {
  const ratings = [Rating.AGAIN, Rating.HARD, Rating.GOOD, Rating.EASY] as const;
  const results: Record<string, string> = {};

  for (const rating of ratings) {
    const result = calculate(state, rating);
    const key = rating === Rating.AGAIN ? 'again'
      : rating === Rating.HARD ? 'hard'
      : rating === Rating.GOOD ? 'good'
      : 'easy';
    results[key] = formatInterval(result.interval);
  }

  return results as unknown as IntervalHints;
}
