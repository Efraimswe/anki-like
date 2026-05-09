import { z } from 'zod';

export const SIDE = z.enum(['l', 'r', 't', 'b']);
export type Side = z.infer<typeof SIDE>;

const SKILL_COLOR = z.enum(['skill-indigo', 'skill-teal', 'skill-rose', 'skill-amber']);

export const SKILL_NAME = z.enum(['Reading', 'Listening', 'Writing', 'Speaking']);
export type SkillName = z.infer<typeof SKILL_NAME>;

const finite = z.number().finite();

const BaseNode = {
  id: z.string().min(1).max(64),
  x: finite,
  y: finite,
  w: finite.min(40),
  h: finite.min(30),
  text: z.string().max(10_000).default(''),
  fontSize: z.number().int().min(10).max(48).optional(),
};

export const SkillNodeSchema = z
  .object({
    ...BaseNode,
    text: SKILL_NAME,
    type: z.literal('skill'),
    color: SKILL_COLOR,
  })
  .strict();

export const SUBSKILL_STATUS = z.enum(['pending', 'in-progress', 'completed']);
export type SubskillStatus = z.infer<typeof SUBSKILL_STATUS>;

export const SubskillNodeSchema = z
  .object({
    ...BaseNode,
    type: z.literal('subskill'),
    parentId: z.string().min(1).max(64),
    color: SKILL_COLOR.optional(),
    status: SUBSKILL_STATUS.optional(),
  })
  .strict();

export const ExerciseNodeSchema = z
  .object({
    ...BaseNode,
    type: z.literal('exercise'),
    parentId: z.string().min(1).max(64),
    color: SKILL_COLOR.optional(),
  })
  .strict();

export const NodeSchema = z.discriminatedUnion('type', [
  SkillNodeSchema,
  SubskillNodeSchema,
  ExerciseNodeSchema,
]);

export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type SubskillNode = z.infer<typeof SubskillNodeSchema>;
export type ExerciseNode = z.infer<typeof ExerciseNodeSchema>;
export type SkillMapNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z
  .object({
    id: z.string().min(1).max(64),
    from: z.string().min(1).max(64),
    fromSide: SIDE,
    to: z.string().min(1).max(64),
    toSide: SIDE,
    kind: z.enum(['straight', 'ortho']),
    segOverrides: z.array(z.number().finite().nullable()).max(16).optional(),
    waypoint: z.object({ x: finite, y: finite }).optional(),
  })
  .strict();

export type SkillMapEdge = z.infer<typeof EdgeSchema>;

export const NODE_CAP = 2000;
export const EDGE_CAP = 4000;

export const SkillMapDocSchema = z
  .object({
    title: z.string().min(1).max(255),
    nodes: z.array(NodeSchema).max(NODE_CAP),
    edges: z.array(EdgeSchema).max(EDGE_CAP),
  })
  .superRefine((doc, ctx) => {
    const byId = new Map(doc.nodes.map((n) => [n.id, n]));

    doc.nodes.forEach((n, i) => {
      if (n.type === 'subskill') {
        const p = byId.get(n.parentId);
        if (!p) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', i, 'parentId'], message: 'Unknown parent id' });
        } else if (p.type !== 'skill' && p.type !== 'subskill') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', i, 'parentId'], message: 'Subskill parent must be a Skill or Subskill' });
        } else {
          // Cycle check: walk parentId chain
          const visited = new Set<string>();
          let cur: string | undefined = n.parentId;
          let steps = 0;
          while (cur && steps < NODE_CAP) {
            if (visited.has(cur)) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', i, 'parentId'], message: 'Subskill parent chain forms a cycle' });
              break;
            }
            visited.add(cur);
            const ancestor = byId.get(cur);
            if (!ancestor || ancestor.type !== 'subskill') break;
            cur = ancestor.parentId;
            steps++;
          }
        }
      }
      if (n.type === 'exercise') {
        const p = byId.get(n.parentId);
        if (!p) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', i, 'parentId'], message: 'Unknown parent id' });
        } else if (p.type !== 'subskill') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', i, 'parentId'], message: 'Exercise parent must be a Subskill' });
        }
      }
    });

    // Edge orphan check
    const nodeIds = new Set(doc.nodes.map((n) => n.id));
    doc.edges.forEach((e, i) => {
      if (!nodeIds.has(e.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', i, 'from'],
          message: `Edge references unknown node id: ${e.from}`,
        });
      }
      if (!nodeIds.has(e.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', i, 'to'],
          message: `Edge references unknown node id: ${e.to}`,
        });
      }
    });
  });

export type SkillMapDoc = z.infer<typeof SkillMapDocSchema>;

export const GetMapResponseSchema = z.object({
  title: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  updatedAt: z.string(),
  isSeed: z.boolean(),
});

export const PutMapResponseSchema = z.object({
  title: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  updatedAt: z.string(),
});
