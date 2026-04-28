import { z } from 'zod';
import { LEVELS, type Level } from './levels';

export const SKILL_KEYS = ['reading', 'listening', 'writing', 'speaking'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export type SkillLevels = Record<SkillKey, Level>;

export const SkillLevelsSchema = z.object({
  reading: z.enum(LEVELS),
  listening: z.enum(LEVELS),
  writing: z.enum(LEVELS),
  speaking: z.enum(LEVELS),
});
