import { z } from 'zod';
import { SKILL_CODES } from './skills';

export const updateDeckSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dailyReviewLimit: z.number().int().min(1).max(9999).optional(),
  dailyAddLimit: z.number().int().min(1).max(9999).optional(),
});

export const createCardSchema = z.object({
  deckId: z.string().uuid(),
  word: z.string().min(1),
  translate: z.string().min(1),
});

export const updateCardSchema = z.object({
  word: z.string().min(1).optional(),
  translate: z.string().min(1).optional(),
});

export const submitReviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
  timeTakenMs: z.number().int().positive().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  targetLanguage: z.enum(['ru']).optional(),
});

export const translateQuerySchema = z.object({
  word: z.string().min(1).max(100),
});

export const skillProgressSchema = z.object({
  skill: z.enum(SKILL_CODES),
  level: z.number().int().min(1).max(10),
  action: z.enum(['complete', 'uncomplete']),
});
