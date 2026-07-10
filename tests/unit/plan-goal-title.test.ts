import { describe, expect, it } from 'vitest';
import { buildBigGoalTitle } from '@/lib/plan';

describe('buildBigGoalTitle', () => {
  it('builds "Complete lvl N of Name" for various skills/levels', () => {
    expect(buildBigGoalTitle('speaking', 1)).toBe('Complete lvl 1 of Speaking');
    expect(buildBigGoalTitle('reading', 5)).toBe('Complete lvl 5 of Reading');
    expect(buildBigGoalTitle('listening', 10)).toBe('Complete lvl 10 of Listening');
    expect(buildBigGoalTitle('writing', 3)).toBe('Complete lvl 3 of Writing');
    expect(buildBigGoalTitle('vocabulary', 7)).toBe('Complete lvl 7 of Vocabulary');
    expect(buildBigGoalTitle('grammar', 2)).toBe('Complete lvl 2 of Grammar');
  });
});
