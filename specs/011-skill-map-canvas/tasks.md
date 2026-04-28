---
description: "Task list for Skill Map — Phase 1 (FigJam-style hub canvas)"
---

# Tasks: Skill Map — Phase 1 (FigJam-style Hub Canvas)

**Input**: Design documents from `/specs/011-skill-map-canvas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution III (Test-First) applies to pure logic (geometry, Zod, reducer, API contract). UI drag/marquee/paint interactions are test-after per the constitution's allowance for layout concerns.

**Organization**: Tasks are grouped by user story so each P1 story can be shipped independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different files, no dependency on incomplete tasks → safe to run in parallel
- **[Story]**: which user story (US1..US7), absent for Setup/Foundational/Polish

## Path Conventions

Absolute paths used throughout. Canvas lives under `src/app/(protected)/map/_components/`. API handler at `src/app/api/map/route.ts`. Shared libs at `src/lib/skillMap/` and `src/lib/queries/`. Tests at `tests/skillMap/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: create directories and stub files the rest of the work writes into.

- [ ] T001 Create feature directory skeleton: `src/app/(protected)/map/_components/`, `src/lib/skillMap/`, `tests/skillMap/` (use `mkdir -p`). No file contents yet.
- [ ] T002 [P] Add new locale keys for sidebar labels in `messages/en.json` (and every other locale under `messages/`): `nav.insights`, `nav.progress`, `nav.newBadge`. Empty strings are acceptable if locales script fills them later.
- [ ] T003 [P] Install no new runtime dependencies; confirm `zod`, `@tanstack/react-query`, `@prisma/client`, `lucide-react` are already in `package.json` (they are) — no-op task recorded for traceability.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: database model, Zod schemas, sample seed, API route, query client wiring. Every user story depends on these.

**⚠️ CRITICAL**: No user-story task can begin until this phase is complete.

### Data layer

- [ ] T004 Add `SkillMap` model and `User.skillMap` relation to `prisma/schema.prisma` exactly as specified in [data-model.md](./data-model.md#prisma-schema-additions).
- [ ] T005 Generate the migration with `pnpm prisma migrate dev --name add_skill_map` and commit the resulting SQL under `prisma/migrations/<timestamp>_add_skill_map/migration.sql`. Run `pnpm prisma generate`.

### Shared schema + seed

- [ ] T006 [P] Create `src/lib/skillMap/schema.ts` re-exporting the Zod schemas from [contracts/schemas.ts](./contracts/schemas.ts) (copy the file verbatim into `src/lib/skillMap/schema.ts`; keep the contracts copy as the source-of-truth reference). Includes `NodeSchema`, `EdgeSchema`, `SkillMapDocSchema`, `NODE_CAP`, `EDGE_CAP`, `GetMapResponseSchema`, `PutMapResponseSchema`.
- [ ] T007 [P] Create `src/types/skillMap.ts` exporting the `z.infer` types: `SkillMapNode`, `SkillMapEdge`, `SkillMapDoc`, `Side`.
- [ ] T008 [P] Create `src/lib/skillMap/sample.ts` exporting `SAMPLE_NODES: SkillMapNode[]` and `SAMPLE_EDGES: SkillMapEdge[]` matching the seed prescribed by the handoff and FR-041: title text node, four shape cards (SPEAKING/amber, LISTENING/blue, READING/green, WRITING/red), three sticky notes (yellow/pink/blue) with example text, ≥3 text labels under SPEAKING, and a mix of `straight` and `ortho` edges connecting them. Node coordinates should fit inside a 1200×700 region starting at (0,0).

### Unit tests FIRST (Constitution III)

- [ ] T009 [P] Write failing Zod validation tests in `tests/skillMap/schema.test.ts`: accepts a valid doc; rejects >2000 nodes; rejects >4000 edges; rejects unknown node type; rejects orphan edge.from/to; rejects NaN coordinates; rejects oversize text.

### API route handler

- [ ] T010 Create `src/app/api/map/route.ts` implementing `GET` (load-or-seed) and `PUT` (validated replace) per [contracts/api-map.md](./contracts/api-map.md). Auth via existing `getSessionFromRequest` / cookie pattern used in other `src/app/api/` routes. On GET with no row: return `{ ...SAMPLE, updatedAt: new Date().toISOString(), isSeed: true }` WITHOUT writing. On PUT: parse with `SkillMapDocSchema`; on success `upsert` by `userId`; respond with the persisted `{ ...doc, updatedAt }`. Return 422 on Zod failure with `{ error: 'invalid_payload', issues }`. `Cache-Control: no-store`.
- [ ] T011 Write failing API contract test in `tests/skillMap/apiContract.test.ts`: mocks or spins up the handler and asserts: authed empty-GET returns seed + `isSeed: true` and does NOT write; PUT with 2001 nodes → 422; PUT with orphan edge → 422; PUT with valid doc → 200, persists, next GET returns persisted + `isSeed: false`; unauth'd GET → 401.

### Query layer

- [ ] T012 [P] Create `src/lib/queries/skillMap.ts` exporting `skillMapKey`, `fetchSkillMap()` (GET wrapper, parses with `GetMapResponseSchema`), and `useSaveSkillMap()` (TanStack `useMutation` PUTing the doc; on success sets query data locally — no refetch needed).

**Checkpoint**: foundation ready — user-story work can begin.

---

## Phase 3: User Story 1 — Discover and open the Skill Map with a sample layout (Priority: P1) 🎯 MVP

**Goal**: sidebar entry exists, `/map` route loads, first-time user sees the seeded sample; returning user sees their own state; deleted-to-empty state stays empty.

**Independent Test**: fresh user signs in, clicks "Progress" in the sidebar, lands on `/map` and sees the sample layout. Reload keeps state. Clearing all content + reload keeps empty (seed does not re-run).

### Implementation for User Story 1

- [ ] T013 [US1] Edit `src/components/layout/AppLayout.tsx` to add an "Insights" section header and a "Progress" item routing to `/map`. Show a small monospace orange `NEW` pill next to the label. Use existing section/item styling patterns; use `lucide-react` icon (e.g. `Sparkles` or `Network`). Labels sourced from `messages/*` via `next-intl` (`nav.insights`, `nav.progress`, `nav.newBadge`).
- [ ] T014 [US1] Create `src/app/(protected)/map/page.tsx` as a server component: read session, `prefetchQuery(skillMapKey, fetchSkillMap)` via server-side `QueryClient`, hydrate, and render `<SkillMapCanvas />`. Page must not render a blocking spinner — follows the dashboard pattern already in the repo (loading.tsx + hydration).
- [ ] T015 [US1] Create `src/app/(protected)/map/loading.tsx` — minimal loading skeleton matching the dashboard skeleton.
- [ ] T016 [US1] Stub `src/app/(protected)/map/_components/SkillMapCanvas.tsx` as a `"use client"` component that reads the prefetched query via `useQuery(skillMapKey, fetchSkillMap)` and renders the `nodes`/`edges` as a read-only static list (no interactions yet) inside a transformed canvas container with a dot-grid background. This is enough to verify US1's independent-test criteria.
- [ ] T017 [US1] Add Tailwind tokens for the canvas in the existing Tailwind config (extend `colors`): `canvas.bg`, `canvas.dot`, `canvas.bg-dark`, `canvas.dot-dark`, `sticky.{yellow,pink,green,blue,orange,purple}`, `shape.{blue,red,amber,green}`. Add dark-mode overrides via `[data-theme="dark"]` CSS variables per research Decision 9.
- [ ] T018 [US1] Verify empty-state logic: delete every node+edge in devtools, PUT an empty doc, reload → canvas shows blank (no re-seed). Add or confirm a test in `tests/skillMap/apiContract.test.ts` covers this.

**Checkpoint**: US1 viable as MVP. Ship it if you just want the new sidebar + sample diagram view.

---

## Phase 4: User Story 2 — Build a map with text, stickies, shapes, and connectors (Priority: P1)

**Goal**: create, edit, move, resize nodes; draw connectors in both modes; anchored to specific sides; bend handles behave correctly.

**Independent Test**: from a blank canvas, place one of each node type, connect them with at least one connector of each mode, drag bends on an ortho connector — all from the visible toolbar only.

### Pure-logic tests FIRST (Constitution III)

- [ ] T019 [P] [US2] Write failing tests in `tests/skillMap/geometry.test.ts`: `portPoint(node, side)` for all 4 sides over 3 node sizes; `nearestSideToPoint(node, px, py)` for points clearly closest to each of the 4 sides and points on the node's center; `orthoRoute(p1, side1, p2, side2)` returns the correct stable segment descriptor array for all 16 side-pair combinations (covering both-horizontal, both-vertical, and 4 mixed cases), and `segOverrides[i]` correctly overrides each segment's `value` without flipping its `axis`.
- [ ] T020 [P] [US2] Write failing tests in `tests/skillMap/docReducer.test.ts`: `createNode` appends + selects + enters edit; `updateNodeText` commits on blur; `moveNodes` applies delta to all selected ids; `resizeNode` respects min size 40×30; `deleteSelection` cascades edges touching deleted nodes; `createEdge` assigns toSide via nearest-side; `reanchorEdge` onto empty space reverts; `overrideSegment` sets scalar; undo stack cap = 80 (81st discards oldest); undo/redo produce identical states after round-trip.

### Implementation for User Story 2

- [ ] T021 [P] [US2] Implement pure geometry in `src/app/(protected)/map/_components/geometry.ts`: `portPoint`, `nearestSideToPoint`, `orthoRoute` (returns `Array<{axis:'h'|'v', value:number}>`), `applySegOverrides`, `pointsFromSegments`, `hitTestEdge(path, px, py, tolerance)`. Pure; no React.
- [ ] T022 [P] [US2] Implement doc reducer + snapshot undo stack in `src/app/(protected)/map/_components/useSkillMapDoc.ts`. Exposes `{ doc, dispatch, undo, redo, canUndo, canRedo }`. Snapshot boundaries exactly as listed in [data-model.md § State Transitions](./data-model.md#state-transitions-client-side-doc-reducer). Cap: 80.
- [ ] T023 [US2] Implement `src/app/(protected)/map/_components/NodeView.tsx`: renders Text/Sticky/Shape node types via discriminated switch; contentEditable for text on double-click; 4 corner resize handles (10×10) shown when selected; 4 connection ports shown on hover/select; rotates sticky by -0.5deg default, 0 on hover. Gate `onMouseDown` with `!editing` per gotcha #5. Emits events via callbacks (no global state reads).
- [ ] T024 [US2] Implement `src/app/(protected)/map/_components/EdgeLayer.tsx`: single `<svg>` with `<marker id="arrow">`. Renders each edge's path (cubic bezier for `straight`; `orthoRoute`-driven polyline for `ortho`). When a connector is selected: bend handles (12×12 blue squares) at each internal segment midpoint AND endpoint handles (white-filled, blue-outlined 6px circles) at each end. Handles call `preventDefault()` on mousedown to avoid text-selection leak (gotcha #1). Bend drag axis locked at mousedown from the stable segment descriptor (gotcha #2). Endpoint drops on empty space revert (gotcha #6).
- [ ] T025 [US2] Implement `src/app/(protected)/map/_components/Toolbar.tsx`: Select / Hand / Sticky (with 2×3 color submenu) / Shape (3 shapes + 4 fills submenu) / Text / connector-mode toggle / Comment (no-op) / More (no-op). Active tool visibly distinguished (`orange-soft` bg + orange icon).
- [ ] T026 [US2] Wire toolbar + NodeView + EdgeLayer into `SkillMapCanvas.tsx` (replacing the US1 read-only stub). Routing: when a node-creating tool is active, canvas click places a new node at event coords + enters edit. Port-drop creates an edge with `fromSide`/`toSide` set via `nearestSideToPoint`. Multi-node drag applies delta to all selected ids.
- [ ] T027 [US2] Connect `useSkillMapDoc` to `useSaveSkillMap` with a 500ms debounce: when `doc` changes, schedule a save; cancel on change; fire on idle. On mount, hydrate from the `useQuery` result. This already satisfies US5 but is a dependency of US2's live-editing flow.

**Checkpoint**: US1+US2 fully usable — you can build maps and they persist.

---

## Phase 5: User Story 3 — Pan, zoom, and navigate (Priority: P1)

**Goal**: pan via Space+drag, middle-click, Hand tool; zoom via Ctrl/Cmd+wheel (zoom-to-cursor); two-finger trackpad pans; reset view.

**Independent Test**: zoom to 200%, pan, click reset — content is back in view at default zoom.

### Implementation for User Story 3

- [ ] T028 [US3] Add viewport state `{ x, y, z }` to `SkillMapCanvas.tsx` (separate from doc reducer). Z bounded `[0.15, 4]`. Apply as `transform: translate(x, y) scale(z)` on the canvas div.
- [ ] T029 [US3] Implement pan handlers in `SkillMapCanvas.tsx`: `Space` keydown/keyup toggles temporary Hand mode (cursor `grab` → `grabbing` during drag); middle-click always pans; Hand tool mousedown pans. Two-finger trackpad wheel (no modifier) pans via `wheel` event delta.
- [ ] T030 [US3] Implement Ctrl/Cmd+wheel zoom in `SkillMapCanvas.tsx` preserving the point under the cursor:
  ```ts
  const f = newZ / oldZ;
  x = cursorX - (cursorX - x) * f;
  y = cursorY - (cursorY - y) * f;
  ```
  Clamp to [0.15, 4]. Trackpad pinch (ctrlKey auto-set by browser on pinch) routes here too.
- [ ] T031 [P] [US3] Implement `src/app/(protected)/map/_components/ZoomControls.tsx`: bottom-right floating control with `–` / `NN%` / `+` / reset. % uses JetBrains Mono font. Buttons dispatch viewport updates.

**Checkpoint**: US1+US2+US3 — editable map with good navigation.

---

## Phase 6: User Story 4 — Select, delete, and undo (Priority: P1)

**Goal**: single + marquee selection, Shift-additive, delete cascades edges, undo/redo up to 80 actions.

**Independent Test**: create 5 nodes + 3 edges, marquee 3 nodes, delete → edges touching them disappear. Undo → restored. Redo → gone.

### Implementation for User Story 4

- [ ] T032 [US4] Implement selection state in `SkillMapCanvas.tsx`: `Set<nodeId>` and `edgeId | null` are mutually exclusive. Click nodes to select; Shift-click toggles in/out; clicking an edge's hit-path selects edge and clears node selection; clicking empty canvas clears both.
- [ ] T033 [US4] Implement marquee selection: drag on empty canvas with Select tool draws a rectangle overlay; on release, nodes intersecting the rect become selected. Shift makes it additive to the previous selection.
- [ ] T034 [US4] Wire Delete/Backspace to dispatch `deleteSelection` (which already cascades edges per T022). Suppress when focus is inside contentEditable/input per T036.
- [ ] T035 [US4] Expose `undo` and `redo` on `SkillMapCanvas` via keyboard (Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y). Include redo-via-`Y` as an alias per FR-034.

**Checkpoint**: US1–US4 — feature MVP complete. Stop here and ship if desired.

---

## Phase 7: User Story 5 — Persistence across sessions (Priority: P1)

**Goal**: edits autosave within ~500ms debounce; returning user sees last saved state; multi-tab last-write-wins.

**Independent Test**: edit, wait ~1s, close tab, reopen → changes present.

**Note**: most of this is already delivered by T010, T012, T027. The tasks here are integration + hardening.

### Implementation for User Story 5

- [ ] T036 [US5] Add a tiny inline "Saved" / "Saving…" / "Save failed" status indicator to the canvas chrome, bound to the TanStack mutation state. On error, schedule a single exponential-backoff retry (2s, 5s) via the mutation's `onError`.
- [ ] T037 [US5] Handle oversize-payload 422 defensively: if a PUT returns 422 due to caps, keep local state and surface a non-destructive toast/message ("Map too large to save"); do not drop the user's local edits. Keep retrying is NOT appropriate here — warn once and stop until the user reduces size.
- [ ] T038 [US5] Manual verification per [quickstart.md § Manual smoke test](./quickstart.md#manual-smoke-test-post-impl) steps 5–6 (reload persistence, two-tab last-write-wins). No automated task — human smoke test.

**Checkpoint**: US1–US5 — persistent, production-shape feature.

---

## Phase 8: User Story 6 — Keyboard shortcuts (Priority: P2)

**Goal**: V / H / T / S tool shortcuts; Space-hold temporary pan; Esc behavior; shortcut suppression while typing.

**Independent Test**: complete an editing session using only the keyboard.

### Implementation for User Story 6

- [ ] T039 [US6] Add a global keydown listener inside `SkillMapCanvas.tsx` (cleans up on unmount). Guard every letter-key shortcut with an `isTypingInField()` check (`document.activeElement` is `input`/`textarea`/`[contenteditable="true"]`). Ctrl/Cmd combos fire regardless (standard web behavior).
- [ ] T040 [US6] Wire the shortcuts from [spec.md FR-034](./spec.md#requirements-mandatory): `V`=Select, `H`=Hand, `T`=Text, `S`=Sticky, Space-hold=temporary Hand (release returns to prior tool), Ctrl/Cmd+Z=undo, Ctrl/Cmd+Shift+Z | Ctrl/Cmd+Y=redo, Delete/Backspace=delete, Esc=clear selection / exit edit / close menu.

**Checkpoint**: US1–US6.

---

## Phase 9: User Story 7 — Right-click context menu (Priority: P3)

**Goal**: right-click empty canvas opens a menu with Add sticky / Add text / Add shape / Undo / Redo / Reset view.

**Independent Test**: right-click empty canvas, pick Add sticky → sticky appears at click position; menu closes.

### Implementation for User Story 7

- [ ] T041 [US7] Create `src/app/(protected)/map/_components/ContextMenu.tsx`: a positioned menu rendered at cursor coords on `contextmenu` event over the canvas. Items: Add sticky / Add text / Add shape (dispatch `createNode` at the right-click canvas coords) / Undo / Redo / Reset view. Close on Esc, outside click, or selection.
- [ ] T042 [US7] Wire `onContextMenu={e => e.preventDefault(); openMenuAt(e.clientX, e.clientY, toCanvasCoords(...))}` on the canvas root. Only open when the click was on empty canvas (not on a node / edge / handle).

**Checkpoint**: US1–US7 — full Phase 1 scope.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Accessibility pass on the sidebar entry and toolbar: aria-labels on every icon button; visible focus rings; keyboard operability of the toolbar without the canvas shortcuts.
- [ ] T044 [P] Dark-mode visual pass: verify `canvas.bg-dark` / `canvas.dot-dark` / dark connector stroke (`#B8B8B8`) kick in with `[data-theme="dark"]`; sticky/shape fills stay vivid. Screenshot both modes.
- [ ] T045 [P] Performance sanity: open a map with ~100 nodes + ~200 edges; observe 60fps pan/zoom in Chrome DevTools (SC-007). If janky, profile and optimize — likely suspect is per-node React re-render on viewport change (memoize `NodeView`).
- [ ] T046 [P] Update `CLAUDE.md` Recent Changes section with a 011 entry summarizing the feature.
- [ ] T047 Run `pnpm lint && pnpm test` and fix any lint/test failures.
- [ ] T048 Manual end-to-end smoke test per [quickstart.md § Manual smoke test](./quickstart.md#manual-smoke-test-post-impl). All 7 steps pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no deps.
- **Phase 2 (Foundational)**: depends on Phase 1 completion. Blocks every US phase.
- **Phase 3 (US1)**: depends on Phase 2. Shippable as MVP.
- **Phases 4–7 (US2–US5)**: depend on Phase 2; US2 enables live editing, which US5's autosave depends on (T027 lives in US2 for delivery ordering). US3 and US4 do not depend on US2 internally but share the canvas component and should land after US2 in practice.
- **Phase 8 (US6)**: depends on US2 (needs tools) and US4 (needs selection for Delete).
- **Phase 9 (US7)**: depends on US2 (needs `createNode`) and US4 (for Undo/Redo menu items).
- **Phase 10 (Polish)**: after all desired user stories.

### Parallel Opportunities

- Phase 1: T002 and T003 can run with T001.
- Phase 2: T006, T007, T008 in parallel once T004/T005 complete. T009 writes tests against T006 in parallel.
- US2: T019 and T020 (test writing) in parallel; then T021 and T022 (pure modules) in parallel; then NodeView/EdgeLayer/Toolbar land sequentially inside `SkillMapCanvas.tsx` wiring.
- US3: T031 (ZoomControls file) in parallel with T028–T030 (logic inside `SkillMapCanvas.tsx`).
- Polish: T043–T046 in parallel.

---

## Parallel Example: User Story 2

```bash
# Write failing tests in parallel (different files):
Task: "Geometry tests in tests/skillMap/geometry.test.ts"          # T019
Task: "Doc reducer tests in tests/skillMap/docReducer.test.ts"     # T020

# Implement pure modules in parallel (different files):
Task: "Geometry helpers in src/app/(protected)/map/_components/geometry.ts"       # T021
Task: "Doc reducer in src/app/(protected)/map/_components/useSkillMapDoc.ts"      # T022
```

---

## Implementation Strategy

### MVP First (Phase 3 only — US1 🎯)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational): Prisma model, API route, Zod, sample seed, query client.
3. Complete Phase 3 (US1): sidebar entry + `/map` page + read-only canvas showing the sample.
4. **STOP AND VALIDATE** — users can find the feature and see the sample diagram. Ship if that's enough for the launch experiment.

### Incremental Delivery

1. After MVP: add US2 (editing) + US3 (pan/zoom) + US4 (selection/delete/undo) + US5 (persistence status) — this is the "real" Phase 1 scope.
2. Then US6 (shortcuts) and US7 (context menu) as quality-of-life additions.
3. Each stop point is a coherent ship candidate.

---

## Format Validation (self-check)

Every task above:

- Starts with `- [ ]`
- Has a sequential `TNNN` id
- Has a [P] marker iff the file is independent of any uncompleted task
- Has a `[USn]` label iff it is in a user-story phase
- Names an exact file path or documented action
