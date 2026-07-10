import { describe, expect, it } from 'vitest';
import { updateGoalTitleSchema } from '@/lib/validations';

describe('updateGoalTitleSchema', () => {
  it('accepts a valid title', () => {
    const result = updateGoalTitleSchema.safeParse({ title: 'Learn 100 words' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = updateGoalTitleSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    const result = updateGoalTitleSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a title longer than 200 characters', () => {
    const result = updateGoalTitleSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('trims the title', () => {
    const result = updateGoalTitleSchema.safeParse({ title: '  hi  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe('hi');
  });
});
