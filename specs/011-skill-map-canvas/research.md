# Phase 0: Research — Skill Map Canvas

All Technical Context entries are resolved; no `NEEDS CLARIFICATION` markers remain.

## Decisions

### 1. Rendering model: DOM nodes + single SVG overlay for edges

- **Decision**: Render nodes as absolutely-positioned React components inside a single transformed `<div class="canvas">` (CSS `transform: translate(x,y) scale(z)`). Render all edges inside one `<svg>` element at the same transform, as `<path>` elements with a shared `<marker id="arrow">`.
- **Rationale**: The design handoff explicitly rejects react-flow (custom nodes/edges would need too much customization to match the port-anchored, bend-handle, Caveat-sticky UX). The handoff's prototype is ~200 lines of plain geometry — simpler than adopting any graph lib. DOM nodes let us reuse Tailwind tokens and contentEditable for text editing. A single SVG overlay is faster than per-edge SVGs and trivially sharing the arrow marker.
- **Alternatives considered**:
  - **react-flow**: rejected by handoff — customization surface larger than rolling our own.
  - **Konva / Pixi / <canvas>**: rejected — breaks text editing, accessibility, Tailwind reuse, and dark-mode theming.

### 2. State management: `useReducer` + snapshot undo stack

- **Decision**: A single reducer owns `{ nodes, edges, selection, editing }`. Undo/redo is a stack of shallow-copied `{ nodes, edges }` snapshots (cap: 80). Snapshots taken at action boundaries (before create/delete/move-start/resize-start/port-drop/endpoint-re-anchor/bend-drag-start) — never per mousemove frame.
- **Rationale**: The handoff warns specifically against per-frame snapshotting. The spec's FR-037/FR-038 require boundary snapshots with ≥80 depth. `useReducer` keeps state transitions centralized and testable.
- **Alternatives**: Immer (overkill for this shape), zustand (not already used), keeping snapshots in the DB (no — viewport + history are per-session).

### 3. Connector geometry: three pure functions

- **Decision**: `portPoint(node, side)`, `nearestSideToPoint(node, px, py)`, and `orthoRoute(p1, side1, p2, side2)` returning a stable array of `{ axis: 'h' | 'v', value: number }` segment descriptors. `segOverrides[i]` scalar overwrites each segment's constant coord.
- **Rationale**: Handoff's gotchas #1 and #2 (axis flip and duplicate bends) are both caused by computing the drag axis from *rendered* geometry. Stable segment descriptors (derived solely from port sides, not from overrides) fix this. Idempotent scalar overrides avoid bend multiplication.
- **Alternatives**: Bézier-only edges (rejected — ortho diagrams are a first-class need). Storing bend paths as arrays of points (rejected — accumulates duplicates on every frame).

### 4. Persistence: new `SkillMap` Prisma model (not a JSON column on `User`)

- **Decision**: New model `SkillMap { id, userId (unique, FK→User), title, nodes (Json), edges (Json), createdAt, updatedAt }`.
- **Rationale**: Keeps `User` clean; Json column on User would couple unrelated concerns and grow with every feature that wants per-user state. Unique `userId` gives 1:1 and enforces "one map per user" at the DB. Easy to evolve (rename fields, add columns) without rewriting User migrations.
- **Alternatives**: Json column on User (simpler migration, but worse separation and a bigger User row in cache). Separate nodes and edges tables (overkill for Phase 1; spec explicitly accepts Json-blob storage).

### 5. API shape: `GET /api/map` (load-or-seed) + `PUT /api/map` (validated replace)

- **Decision**: GET returns the user's map or, if none exists, the seeded sample (without writing it — the first PUT from the client materializes it). PUT replaces the full document after Zod validation and hard caps.
- **Rationale**: Replace-on-save matches the client's "local state is source of truth during editing" model. It trades bytes for simplicity — valid for personal maps (tens to hundreds of nodes; KB-scale payloads). Seeding on GET (without writing) means deleting everything then reloading keeps the empty state, satisfying FR-042.
- **Alternatives**: PATCH per-entity (premature complexity; the whole doc is small). Seed-on-first-PUT (also valid, but requires client to know "I'm first" and fall back to seed — more branching).

### 6. Autosave: TanStack Query mutation with 500ms debounce

- **Decision**: Client holds doc in React state. A `useEffect` with a 500ms debounce fires the mutation on changes. On success: invalidate the query so refetch is available. On failure: retry once with backoff; keep local state as source of truth.
- **Rationale**: 500ms balances "save within 1s of last edit" (SC-004) with typical burst typing. TanStack Query is already in the app (v5 with devtools) — reuse existing QueryClient and providers.
- **Alternatives**: Per-action saves (too chatty). Save-on-blur only (loses unsaved changes to crashes). SSE/WebSocket (far out of Phase 1 scope).

### 7. Sidebar integration: edit `AppLayout.tsx` to add "Insights → Progress (NEW)"

- **Decision**: Extend the existing sidebar component rather than introducing new navigation abstractions. A new section header "Insights" is added above or below the current section. The "Progress" item routes to `/map` and shows a small monospace `NEW` pill in orange.
- **Rationale**: Existing sidebar already supports the visual language; creating a parallel nav component would fragment the app. `next-intl` is in use — add locale keys for the new labels.
- **Alternatives**: Floating entry point on the dashboard (less discoverable per SC-001/SC-008).

### 8. Sample seed: constant module, seeded on first GET, server-side

- **Decision**: Ship `SAMPLE_NODES` + `SAMPLE_EDGES` as a TS constant at `src/lib/skillMap/sample.ts`. GET returns it as the body when no `SkillMap` row exists. The row is only created on the first PUT (which may or may not include the seed — irrelevant; the server only stores what the client sends).
- **Rationale**: Matches FR-041/FR-042 exactly: non-empty first visit, and "delete everything + reload" stays empty because a row with empty arrays now exists.
- **Alternatives**: Seed on signup (writes rows for users who never open the feature — wasteful).

### 9. Dark mode: reuse existing `[data-theme="dark"]` toggle

- **Decision**: Add canvas-specific CSS variables (`--canvas-bg`, `--canvas-dot`, `--connector-stroke`) scoped to `[data-theme="dark"]`. Sticky and shape fills stay vivid (they're content, not chrome).
- **Rationale**: Single source of truth for theming; zero new infrastructure; matches FR-045.
- **Alternatives**: Theme-aware component branching (violates existing app pattern).

### 10. Keyboard shortcut suppression inside contentEditable

- **Decision**: Global keydown listener in `SkillMapCanvas.tsx` checks `document.activeElement` for `input`, `textarea`, or `[contenteditable="true"]` and bails early for letter-key shortcuts. Meta/Ctrl combos (undo/redo/delete) still fire — standard web behavior.
- **Rationale**: FR-035 requirement; matches web norms.
- **Alternatives**: Per-node mount/unmount listeners (fragile, misses edge cases).

### 11. Testing strategy

- **Unit (vitest, pre-impl)**:
  - `geometry.test.ts`: `portPoint` on all 4 sides across node sizes; `orthoRoute` for all 9 side-pair permutations; `nearestSideToPoint` boundary conditions.
  - `schema.test.ts`: Zod acceptance and rejection (invalid enums, missing fields, oversized arrays).
  - `docReducer.test.ts`: create node, delete cascades edges, multi-drag delta, undo/redo boundaries, undo depth cap.
  - `apiContract.test.ts`: GET on empty returns seed; PUT with 2001 nodes rejected; PUT with good payload returns 200 and persists.
- **Manual (post-impl)**: Canvas drag / marquee / port-drop / bend-drag / endpoint re-anchor; dark-mode visual check; multi-tab last-write-wins.

## Rejected Paths Worth Recording

- **react-flow**: See Decision 1. Worth a one-line note in the code pointing readers back here if they wonder why.
- **Per-frame undo snapshots**: Would make undo jump pixel-by-pixel through a drag; also inflates memory fast. Boundary snapshots are an explicit requirement.
- **Zustand / Jotai**: Not currently in the stack; one reducer per canvas page is enough.
