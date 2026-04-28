# Phase 1: Data Model — Skill Map Canvas

## Prisma Schema (additions)

```prisma
model SkillMap {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @unique @map("user_id") @db.Uuid
  title     String   @default("My Skill Map") @db.VarChar(255)
  nodes     Json     @default("[]")
  edges     Json     @default("[]")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("skill_maps")
}
```

And on `User`:

```prisma
model User {
  // ...existing fields...
  skillMap SkillMap?
}
```

## Application Types (derived from Zod schemas; see `contracts/schemas.ts`)

### Node (discriminated union on `type`)

Common fields (all node types):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Client-generated (cuid or crypto.randomUUID). |
| `type` | `'text' \| 'sticky' \| 'shape'` | Discriminator. |
| `x` | `number` | Canvas coordinate. |
| `y` | `number` | Canvas coordinate. |
| `w` | `number` | ≥ 40. |
| `h` | `number` | ≥ 30. |
| `text` | `string` | May be empty. Max length 10_000. |

Type-specific extras:

| Node type | Extra fields |
|---|---|
| `text` | `fontSize?: number` (12–96), `fontWeight?: 400 \| 500 \| 600 \| 700`, `color?: 'muted'` |
| `sticky` | `color: 'sticky-yellow' \| 'sticky-pink' \| 'sticky-green' \| 'sticky-blue' \| 'sticky-orange' \| 'sticky-purple'` |
| `shape` | `shape: 'rect' \| 'ellipse' \| 'diamond'`, `fill: 'shape-blue' \| 'shape-red' \| 'shape-amber' \| 'shape-green'` |

### Edge

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Client-generated. |
| `from` | `string` | Node id. Must exist in `nodes[]`. |
| `fromSide` | `'l' \| 'r' \| 't' \| 'b'` | Fixed; never auto-rerouted. |
| `to` | `string` | Node id. Must exist in `nodes[]`. |
| `toSide` | `'l' \| 'r' \| 't' \| 'b'` | Fixed. |
| `kind` | `'straight' \| 'ortho'` | Routing mode. |
| `segOverrides?` | `(number \| null)[]` | Per-internal-segment overrides for ortho edges. Length == number of orthogonal bend segments. `null` = use computed value. |

### SkillMapDoc (server payload)

```ts
type SkillMapDoc = {
  title: string;     // 1..255
  nodes: Node[];     // length ≤ 2000
  edges: Edge[];     // length ≤ 4000
};
```

## Relationships

- `User 1 : 0..1 SkillMap` (unique `userId`; delete-cascade on user deletion).
- `Edge.from`, `Edge.to` → `Node.id` (referential integrity enforced client-side and in PUT validation; not a DB FK because nodes are inside a Json blob).

## Validation Rules (enforced server-side in PUT)

- `title.length` 1..255.
- `nodes.length` ≤ 2000.
- `edges.length` ≤ 4000.
- Each `Edge.from` and `Edge.to` MUST reference an id in `nodes[]`. Orphan references rejected with 422.
- Each node's discriminator (`type`) matches its type-specific extras exactly (no extraneous fields; Zod `strict`).
- Coordinates/sizes are finite numbers (no NaN, no Infinity).
- `text` ≤ 10_000 characters per node (generous).
- On any validation failure, the prior persisted row is untouched. Response: 422 with error summary.

## State Transitions (Client-side doc reducer)

| Action | Pre-state | Effect | Snapshot boundary? |
|---|---|---|---|
| `createNode` | tool active | Append node; select it; optionally enter edit. | Yes (before append) |
| `updateNodeText` | node in edit | Replace `text` on commit (blur/Esc). | Yes (before replace) |
| `moveNodes` | drag end | Apply delta to all selected ids. | Yes (at mousedown) |
| `resizeNode` | drag end of corner handle | Update `w`, `h`, `x`, `y`. | Yes (at mousedown) |
| `deleteSelection` | Delete/Backspace | Remove selected nodes AND edges referencing them; clear selection. | Yes (before remove) |
| `createEdge` | port drop | Append edge with fromSide/toSide set to nearest sides. | Yes (before append) |
| `reanchorEdge` | endpoint-handle drop | Update `to`/`toSide` (or `from`/`fromSide`); revert if dropped in empty space. | Yes (at mousedown) |
| `overrideSegment` | bend-handle drop | Set `segOverrides[i]` to new scalar. | Yes (at mousedown) |
| `setConnectorKind` | toolbar toggle | No doc mutation; tool-state only. | No |
| `undo` / `redo` | stack non-empty | Swap current doc with adjacent snapshot. | No (stack op, not mutation) |

Undo stack cap: 80 entries. Oldest dropped when exceeded.

## Viewport State (client-only, NOT persisted server-side)

```ts
type Viewport = { x: number; y: number; z: number };
```

- `z` bounded `[0.15, 4]`.
- Optionally persisted to `localStorage` during dev; client-only (per-session) in prod per FR spec.
