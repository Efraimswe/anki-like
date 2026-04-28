import { describe, it, expect } from 'vitest';
import {
  SkillMapDocSchema,
  NodeSchema,
  EdgeSchema,
  NODE_CAP,
  EDGE_CAP,
} from '@/lib/skillMap/schema';

const validSkill    = { id: 'n1', type: 'skill'    as const, x: 0, y: 0,   w: 220, h: 120, text: 'Speaking',     color: 'skill-indigo' as const };
const validSubskill = { id: 'n2', type: 'subskill' as const, x: 0, y: 200, w: 180, h: 90,  text: 'Meetings',     parentId: 'n1' };
const validExercise = { id: 'n3', type: 'exercise' as const, x: 0, y: 380, w: 160, h: 72,  text: 'Lead standup', parentId: 'n2' };
const validEdge = { id: 'e1', from: 'n1', fromSide: 'r' as const, to: 'n1', toSide: 'l' as const, kind: 'straight' as const };

const validDoc          = { title: 'Test Map', nodes: [validSkill], edges: [] };
const validHierarchyDoc = { title: 'Hierarchy', nodes: [validSkill, validSubskill, validExercise], edges: [] };

describe('NodeSchema', () => {
  it('accepts a valid skill node (all colors)', () => {
    for (const color of ['skill-indigo', 'skill-teal', 'skill-rose', 'skill-amber'] as const) {
      expect(NodeSchema.safeParse({ ...validSkill, color }).success).toBe(true);
    }
  });
  it('accepts skill with each canonical name', () => {
    for (const text of ['Reading', 'Listening', 'Writing', 'Speaking'] as const) {
      expect(NodeSchema.safeParse({ ...validSkill, text }).success).toBe(true);
    }
  });
  it('rejects skill with non-canonical text', () => {
    expect(NodeSchema.safeParse({ ...validSkill, text: 'Frobnicate' }).success).toBe(false);
  });
  it('rejects skill with unknown color', () => {
    expect(NodeSchema.safeParse({ ...validSkill, color: 'skill-purple' }).success).toBe(false);
  });
  it('rejects skill with extraneous parentId field (strict)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, parentId: 'n1' }).success).toBe(false);
  });
  it('accepts a valid subskill node', () => {
    expect(NodeSchema.safeParse(validSubskill).success).toBe(true);
  });
  it('accepts a valid exercise node', () => {
    expect(NodeSchema.safeParse(validExercise).success).toBe(true);
  });
  it('rejects type "text" (no longer valid)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, type: 'text' }).success).toBe(false);
  });
  it('rejects type "sticky" (no longer valid)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, type: 'sticky' }).success).toBe(false);
  });
  it('rejects type "shape" (no longer valid)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, type: 'shape' }).success).toBe(false);
  });
  it('rejects unknown node type', () => {
    expect(NodeSchema.safeParse({ ...validSkill, type: 'image' }).success).toBe(false);
  });
  it('rejects NaN x coordinate', () => {
    expect(NodeSchema.safeParse({ ...validSkill, x: NaN }).success).toBe(false);
  });
  it('rejects Infinity coordinate', () => {
    expect(NodeSchema.safeParse({ ...validSkill, y: Infinity }).success).toBe(false);
  });
  it('rejects w below minimum (40)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, w: 10 }).success).toBe(false);
  });
  it('rejects h below minimum (30)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, h: 5 }).success).toBe(false);
  });
  it('rejects text over 10000 chars', () => {
    expect(NodeSchema.safeParse({ ...validSubskill, text: 'a'.repeat(10_001) }).success).toBe(false);
  });
  it('rejects extraneous fields (strict)', () => {
    expect(NodeSchema.safeParse({ ...validSkill, unknown: true }).success).toBe(false);
  });
});

describe('EdgeSchema', () => {
  it('accepts a valid edge', () => {
    expect(EdgeSchema.safeParse(validEdge).success).toBe(true);
  });
  it('accepts ortho edge with segOverrides', () => {
    expect(EdgeSchema.safeParse({ ...validEdge, kind: 'ortho', segOverrides: [100, null] }).success).toBe(true);
  });
  it('rejects invalid fromSide', () => {
    expect(EdgeSchema.safeParse({ ...validEdge, fromSide: 'x' }).success).toBe(false);
  });
  it('rejects invalid kind', () => {
    expect(EdgeSchema.safeParse({ ...validEdge, kind: 'curved' }).success).toBe(false);
  });
});

describe('SkillMapDocSchema', () => {
  it('accepts a valid doc', () => {
    expect(SkillMapDocSchema.safeParse(validDoc).success).toBe(true);
  });

  it('rejects doc exceeding NODE_CAP', () => {
    const nodes = Array.from({ length: NODE_CAP + 1 }, (_, i) => ({
      ...validSkill,
      id: `n${i}`,
    }));
    expect(SkillMapDocSchema.safeParse({ ...validDoc, nodes, edges: [] }).success).toBe(false);
  });

  it('rejects doc exceeding EDGE_CAP', () => {
    const nodes = [validSkill, { ...validSkill, id: 'n2' }];
    const edges = Array.from({ length: EDGE_CAP + 1 }, (_, i) => ({
      ...validEdge,
      id: `e${i}`,
      to: 'n2',
    }));
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes, edges }).success).toBe(false);
  });

  it('rejects edge with orphan from reference', () => {
    const result = SkillMapDocSchema.safeParse({
      ...validDoc,
      edges: [{ ...validEdge, from: 'ghost_node' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects edge with orphan to reference', () => {
    const result = SkillMapDocSchema.safeParse({
      ...validDoc,
      edges: [{ ...validEdge, to: 'ghost_node' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(SkillMapDocSchema.safeParse({ ...validDoc, title: '' }).success).toBe(false);
  });

  it('rejects title over 255 chars', () => {
    expect(SkillMapDocSchema.safeParse({ ...validDoc, title: 'a'.repeat(256) }).success).toBe(false);
  });

  it('accepts valid skill/subskill/exercise hierarchy', () => {
    expect(SkillMapDocSchema.safeParse(validHierarchyDoc).success).toBe(true);
  });

  it('rejects subskill with unknown parentId', () => {
    const bad = { ...validSubskill, parentId: 'ghost' };
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes: [validSkill, bad], edges: [] }).success).toBe(false);
  });

  it('rejects subskill whose parentId points at an exercise (wrong parent type)', () => {
    const bad = { ...validSubskill, id: 'n5b', parentId: 'n3' };
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes: [validSkill, validSubskill, validExercise, bad], edges: [] }).success).toBe(false);
  });

  it('rejects exercise whose parentId points at a skill (must be subskill)', () => {
    const bad = { ...validExercise, id: 'n6b', parentId: 'n1' };
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes: [validSkill, bad], edges: [] }).success).toBe(false);
  });

  it('rejects exercise with unknown parentId', () => {
    const bad = { ...validExercise, parentId: 'ghost' };
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes: [validSkill, validSubskill, bad], edges: [] }).success).toBe(false);
  });

  it('rejects two exercises sharing the same parentId (duplicate)', () => {
    const ex2 = { ...validExercise, id: 'n7', parentId: 'n2' };
    expect(SkillMapDocSchema.safeParse({ title: 'x', nodes: [validSkill, validSubskill, validExercise, ex2], edges: [] }).success).toBe(false);
  });
});
