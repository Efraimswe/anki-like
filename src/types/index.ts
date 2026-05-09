// User
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  nativeLanguage?: string | null;
  createdAt?: string;
}

// Deck
export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  dueCount: number;
  newCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// Card
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

// Card State (spaced repetition)
export interface CardState {
  phase: string;
  interval: number;
  stability?: number;
  difficulty?: number;
  dueDate?: string;
}

// Review
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

export interface ReviewResult {
  cardId: string;
  previousState: CardState;
  newState: CardState;
  intervalDisplay?: string;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

// Session
export interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// Statistics
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

export interface DeckFsrsConfig {
  desiredRetention: number;
  maximumInterval: number;
  weights: number[];
  learningSteps: string[];
  relearningSteps: string[];
  isOptimized: boolean;
  lastOptimizedAt: string | null;
}

export interface DeckFsrsOptimizationResult {
  ok: boolean;
  reason?: string;
  reviewCount: number;
  cardCount: number;
  config?: DeckFsrsConfig;
}

// API Error
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
