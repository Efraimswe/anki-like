// User
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  targetLanguage: string;
  createdAt?: string;
}

// Deck
export interface Deck {
  id: string;
  name: string;
  dailyReviewLimit: number;
  dailyAddLimit: number;
  cardCount: number;
  dueCount: number;
  addedToday?: number;
  reviewedToday?: number;
  createdAt: string;
  updatedAt?: string;
}

// Card
export interface Card {
  id: string;
  deckId: string;
  word: string;
  translate: string;
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
  word: string;
  translate: string;
  phase: string;
  dueDate: string;
  intervalHints?: IntervalHints;
}

export interface DueCardsResponse {
  cards: DueCard[];
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

// API Error
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Skills
import type { SkillCode } from '@/lib/skills';
export type SkillsResponse = { progress: Record<SkillCode, number> };
export interface SkillProgressUpdate { skill: SkillCode; completedLevel: number; }

// Plan (goals)
export interface PlanMediumGoal {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}
export interface PlanBigGoal {
  id: string;
  skill: SkillCode;      // SkillCode уже импортирован в файле для Skills-типов
  level: number;
  title: string;
  completed: boolean;
  createdAt: string;
  mediumGoals: PlanMediumGoal[];
}
export interface PlanGoalsResponse { goals: PlanBigGoal[]; }
export interface CreateBigGoalResult { goal: PlanBigGoal; duplicate: boolean; }
export interface CreateMediumGoalResult { medium: PlanMediumGoal; }
