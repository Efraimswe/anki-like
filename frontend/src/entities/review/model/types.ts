export interface IntervalHints {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export interface DueCard {
  id: string;
  front: string;
  back: string;
  type: string;
  phase: string;
  dueDate: string;
  intervalHints?: IntervalHints;
}

export interface DueCardsResponse {
  cards: DueCard[];
  remainingNew: number;
  remainingReviews: number;
  nextDueDate: string | null;
}

export interface CardState {
  phase: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate?: string;
}

export interface ReviewResult {
  cardId: string;
  previousState: CardState;
  newState: CardState;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';
