import { Injectable } from '@nestjs/common';

export enum Rating {
  AGAIN = 0,
  HARD = 2,
  GOOD = 3,
  EASY = 5,
}

export interface CardState {
  interval: number;
  easeFactor: number;
  repetitions: number;
  phase: 'new' | 'learning' | 'review' | 'relearning';
}

export interface Sm2Result extends CardState {
  dueDate: Date;
}

@Injectable()
export class Sm2Service {
  calculate(state: CardState, rating: Rating): Sm2Result {
    const quality = rating as number;
    let { interval, easeFactor, repetitions, phase } = state;

    // Calculate new ease factor using SM-2 formula
    const newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    // Calculate new interval and repetitions
    if (rating === Rating.AGAIN) {
      // Again: full reset
      repetitions = 0;
      interval = 1;
    } else if (rating === Rating.HARD) {
      // Hard: slight increase (multiply by 1.2 instead of full easeFactor)
      if (repetitions === 0) {
        interval = 1;
      } else {
        interval = Math.max(state.interval + 1, Math.round(state.interval * 1.2));
      }
      repetitions += 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Apply Easy bonus: increase interval further
    if (rating === Rating.EASY) {
      interval = Math.round(interval * 1.3);
    }

    // Cap at 365 days
    interval = Math.min(interval, 365);

    // Phase transitions
    const newPhase = this.calculatePhase(phase, rating);

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);

    return {
      interval,
      easeFactor: newEaseFactor,
      repetitions,
      phase: newPhase,
      dueDate,
    };
  }

  private calculatePhase(
    currentPhase: CardState['phase'],
    rating: Rating,
  ): CardState['phase'] {
    switch (currentPhase) {
      case 'new':
        return 'learning';
      case 'learning':
        return rating >= Rating.GOOD ? 'review' : 'learning';
      case 'review':
        return rating === Rating.AGAIN ? 'relearning' : 'review';
      case 'relearning':
        return rating >= Rating.GOOD ? 'review' : 'relearning';
      default:
        return currentPhase;
    }
  }
}
