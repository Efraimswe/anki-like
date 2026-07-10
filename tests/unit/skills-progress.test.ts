import { describe, expect, it } from 'vitest';
import { nextCompletedLevel } from '@/lib/skills';

describe('nextCompletedLevel (complete)', () => {
  it('advances exactly one level past the current completed level', () => {
    expect(nextCompletedLevel(0, 1, 'complete')).toBe(1);
    expect(nextCompletedLevel(4, 5, 'complete')).toBe(5);
    expect(nextCompletedLevel(9, 10, 'complete')).toBe(10);
  });

  it('rejects skipping ahead', () => {
    expect(nextCompletedLevel(0, 2, 'complete')).toBeNull();
    expect(nextCompletedLevel(4, 6, 'complete')).toBeNull();
  });

  it('rejects completing an already-completed level or lower', () => {
    expect(nextCompletedLevel(5, 5, 'complete')).toBeNull();
    expect(nextCompletedLevel(5, 4, 'complete')).toBeNull();
  });
});

describe('nextCompletedLevel (uncomplete)', () => {
  it('rolls back only the current top level', () => {
    expect(nextCompletedLevel(5, 5, 'uncomplete')).toBe(4);
    expect(nextCompletedLevel(1, 1, 'uncomplete')).toBe(0);
    expect(nextCompletedLevel(10, 10, 'uncomplete')).toBe(9);
  });

  it('rejects uncompleting a level that is not the current top', () => {
    expect(nextCompletedLevel(5, 4, 'uncomplete')).toBeNull();
    expect(nextCompletedLevel(5, 6, 'uncomplete')).toBeNull();
    expect(nextCompletedLevel(0, 1, 'uncomplete')).toBeNull();
  });
});

describe('nextCompletedLevel (level bounds)', () => {
  it('rejects level below 1', () => {
    expect(nextCompletedLevel(0, 0, 'complete')).toBeNull();
    expect(nextCompletedLevel(0, -1, 'complete')).toBeNull();
  });

  it('rejects level above 10', () => {
    expect(nextCompletedLevel(10, 11, 'complete')).toBeNull();
  });

  it('accepts the boundary levels 1 and 10', () => {
    expect(nextCompletedLevel(0, 1, 'complete')).toBe(1);
    expect(nextCompletedLevel(9, 10, 'complete')).toBe(10);
  });
});
