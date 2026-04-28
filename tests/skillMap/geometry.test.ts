import { describe, it, expect } from 'vitest';
import { portPoint, nearestSideToPoint, orthoSegments, applySegOverrides } from '@/app/(protected)/map/geometry';
import type { SkillMapNode } from '@/types/skillMap';

const makeNode = (x = 0, y = 0, w = 100, h = 60): SkillMapNode => ({
  id: 'n1', type: 'skill', x, y, w, h, text: 'Reading', color: 'skill-indigo',
});

describe('portPoint', () => {
  const n = makeNode(10, 20, 100, 60);
  it('left port', () => expect(portPoint(n, 'l')).toEqual({ x: 10, y: 50 }));
  it('right port', () => expect(portPoint(n, 'r')).toEqual({ x: 110, y: 50 }));
  it('top port', () => expect(portPoint(n, 't')).toEqual({ x: 60, y: 20 }));
  it('bottom port', () => expect(portPoint(n, 'b')).toEqual({ x: 60, y: 80 }));
});

describe('nearestSideToPoint', () => {
  const n = makeNode(0, 0, 100, 60);
  it('point far right → r', () => expect(nearestSideToPoint(n, 200, 30)).toBe('r'));
  it('point far left → l', () => expect(nearestSideToPoint(n, -100, 30)).toBe('l'));
  it('point above → t', () => expect(nearestSideToPoint(n, 50, -100)).toBe('t'));
  it('point below → b', () => expect(nearestSideToPoint(n, 50, 200)).toBe('b'));
  it('point at exact right edge → r', () => expect(nearestSideToPoint(n, 100, 30)).toBe('r'));
});

describe('orthoSegments', () => {
  const p1 = { x: 0, y: 50 };
  const p2 = { x: 200, y: 100 };

  it('both horizontal (r→l) → 3 segments, first axis h', () => {
    const segs = orthoSegments('r', 'l', p1, p2);
    expect(segs.length).toBe(3);
    expect(segs[0].axis).toBe('h');
  });

  it('both vertical (b→t) → 3 segments, first axis v', () => {
    const segs = orthoSegments('b', 't', p1, p2);
    expect(segs.length).toBe(3);
    expect(segs[0].axis).toBe('v');
  });

  it('mixed h→v (r→t) → 2 segments', () => {
    const segs = orthoSegments('r', 't', p1, p2);
    expect(segs.length).toBe(2);
    expect(segs[0].axis).toBe('h');
  });

  it('mixed v→h (b→l) → 2 segments', () => {
    const segs = orthoSegments('b', 'l', p1, p2);
    expect(segs.length).toBe(2);
    expect(segs[0].axis).toBe('v');
  });

  it('axis is stable regardless of p1/p2 values', () => {
    const s1 = orthoSegments('r', 'l', p1, p2);
    const s2 = orthoSegments('r', 'l', { x: 500, y: 300 }, { x: 10, y: 10 });
    expect(s1.map((s) => s.axis)).toEqual(s2.map((s) => s.axis));
  });
});

describe('applySegOverrides', () => {
  it('null overrides leave segment unchanged', () => {
    const segs = [{ axis: 'h' as const, value: 100 }];
    expect(applySegOverrides(segs, [null])[0].value).toBe(100);
  });

  it('non-null override replaces value', () => {
    const segs = [{ axis: 'h' as const, value: 100 }];
    expect(applySegOverrides(segs, [250])[0].value).toBe(250);
  });

  it('axis is never changed by override', () => {
    const segs = [{ axis: 'v' as const, value: 100 }];
    expect(applySegOverrides(segs, [999])[0].axis).toBe('v');
  });

  it('partial overrides (shorter array) leave rest unchanged', () => {
    const segs = [{ axis: 'h' as const, value: 1 }, { axis: 'v' as const, value: 2 }];
    const result = applySegOverrides(segs, [50]);
    expect(result[0].value).toBe(50);
    expect(result[1].value).toBe(2);
  });
});
