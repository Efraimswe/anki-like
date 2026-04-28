/**
 * Zod schemas for the Skill Map feature. Shared between the
 * API route handler (server-side validation) and the client types.
 *
 * Runtime copy lives at `src/lib/skillMap/schema.ts` (re-export).
 */
import { z } from "zod";

export const SIDE = z.enum(["l", "r", "t", "b"]);
export type Side = z.infer<typeof SIDE>;

const STICKY_COLOR = z.enum([
  "sticky-yellow",
  "sticky-pink",
  "sticky-green",
  "sticky-blue",
  "sticky-orange",
  "sticky-purple",
]);

const SHAPE_KIND = z.enum(["rect", "ellipse", "diamond"]);
const SHAPE_FILL = z.enum([
  "shape-blue",
  "shape-red",
  "shape-amber",
  "shape-green",
]);

const finite = z.number().finite();
const nonNegFinite = z.number().finite();

const BaseNode = {
  id: z.string().min(1).max(64),
  x: finite,
  y: finite,
  w: nonNegFinite.min(40),
  h: nonNegFinite.min(30),
  text: z.string().max(10_000).default(""),
};

export const TextNodeSchema = z
  .object({
    ...BaseNode,
    type: z.literal("text"),
    fontSize: z.number().int().min(12).max(96).optional(),
    fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
    color: z.literal("muted").optional(),
  })
  .strict();

export const StickyNodeSchema = z
  .object({
    ...BaseNode,
    type: z.literal("sticky"),
    color: STICKY_COLOR,
  })
  .strict();

export const ShapeNodeSchema = z
  .object({
    ...BaseNode,
    type: z.literal("shape"),
    shape: SHAPE_KIND,
    fill: SHAPE_FILL,
  })
  .strict();

export const NodeSchema = z.discriminatedUnion("type", [
  TextNodeSchema,
  StickyNodeSchema,
  ShapeNodeSchema,
]);

export type TextNode = z.infer<typeof TextNodeSchema>;
export type StickyNode = z.infer<typeof StickyNodeSchema>;
export type ShapeNode = z.infer<typeof ShapeNodeSchema>;
export type SkillMapNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z
  .object({
    id: z.string().min(1).max(64),
    from: z.string().min(1).max(64),
    fromSide: SIDE,
    to: z.string().min(1).max(64),
    toSide: SIDE,
    kind: z.enum(["straight", "ortho"]),
    segOverrides: z.array(z.number().finite().nullable()).max(16).optional(),
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
    const nodeIds = new Set(doc.nodes.map((n) => n.id));
    doc.edges.forEach((e, i) => {
      if (!nodeIds.has(e.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges", i, "from"],
          message: `Edge references unknown node id: ${e.from}`,
        });
      }
      if (!nodeIds.has(e.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges", i, "to"],
          message: `Edge references unknown node id: ${e.to}`,
        });
      }
    });
  });

export type SkillMapDoc = z.infer<typeof SkillMapDocSchema>;

export const GetMapResponseSchema = z.object({
  title: z.string().min(1).max(255),
  nodes: z.array(NodeSchema).max(NODE_CAP),
  edges: z.array(EdgeSchema).max(EDGE_CAP),
  updatedAt: z.string(),
  isSeed: z.boolean(),
});

export const PutMapResponseSchema = z.object({
  title: z.string().min(1).max(255),
  nodes: z.array(NodeSchema).max(NODE_CAP),
  edges: z.array(EdgeSchema).max(EDGE_CAP),
  updatedAt: z.string(),
});
