import { SKILLS, type SkillCode } from '@/lib/skills';

// "Complete lvl 3 of Speaking"
export function buildBigGoalTitle(skill: SkillCode, level: number): string {
  return `Complete lvl ${level} of ${SKILLS[skill].name}`;
}
