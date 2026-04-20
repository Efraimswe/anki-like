import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
});

export const updateDeckSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const createCardSchema = z.object({
  deckId: z.string().uuid(),
  front: z.string().min(1),
  back: z.string().min(1),
  type: z.enum(['basic', 'reverse', 'cloze']),
  tags: z.array(z.string()).optional().default([]),
});

export const updateCardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export const submitReviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
  timeTakenMs: z.number().int().positive().optional(),
});

export const updateDailyLimitsSchema = z.object({
  maxNewCards: z.number().int().min(1).max(9999).optional(),
  maxReviews: z.number().int().min(1).max(9999).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  password: z.string().min(8).optional(),
  interfaceLanguage: z.string().min(2).max(10).optional(),
});

export const statisticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'all']).optional().default('week'),
});

export const updateDeckFsrsSchema = z.object({
  desiredRetention: z.number().min(0.7).max(0.99).optional(),
  maximumInterval: z.number().int().min(1).max(36500).optional(),
});
