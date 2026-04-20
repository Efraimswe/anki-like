import { z } from 'zod';

export const GOAL_PRESETS = [
  'Get a remote job in tech',
  'Pass IELTS / TOEFL',
  'Travel without language barriers',
  'Watch shows without subtitles',
  'Move abroad',
  'Read books in English',
  'Sound more confident at work',
  'Talk to international friends',
] as const;

export const GoalsSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const obj = raw as Record<string, unknown>;
    const cleaned: Record<string, unknown> = { primary: obj.primary };
    if (obj.secondary && typeof obj.secondary === 'string' && obj.secondary.trim())
      cleaned.secondary = obj.secondary.trim();
    return cleaned;
  },
  z
    .object({
      primary: z.string().trim().min(1).max(120),
      secondary: z.string().max(500).optional(),
    })
    .strict()
);

export type GoalsPayload = {
  primary: string;
  secondary?: string;
};
