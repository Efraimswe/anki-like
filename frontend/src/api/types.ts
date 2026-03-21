export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  dueCount: number;
  newCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: 'basic' | 'reverse' | 'cloze';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

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

export interface DailyStat {
  date: string;
  reviews: number;
  timeMinutes: number;
  accuracy: number;
}

export interface Statistics {
  retentionRate: number;
  totalReviews: number;
  accuracyPercent: number;
  totalTimeMinutes: number;
  dailyBreakdown: DailyStat[];
}

export interface DailyLimits {
  maxNewCards: number;
  maxReviews: number;
  todayNewCount: number;
  todayReviewCount: number;
}
