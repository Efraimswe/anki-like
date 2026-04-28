# Feature Specification: Skill Map — Phase 1 (FigJam-style Hub Canvas)

**Feature Branch**: `011-skill-map-canvas`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "Add a 'Progress' sidebar entry that opens a FigJam-style infinite canvas at /map. Phase 1: canvas hub only — no skill/exercise integration. Text/sticky/shape nodes, straight+orthogonal connectors, select/drag/resize/delete, undo/redo, per-user persistence with debounced autosave, seeded sample map for first-time users."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and open the Skill Map with a sample layout (Priority: P1)

A learner sees a new **Progress** item in the sidebar (under a new *Insights* group, tagged *NEW*) and clicks it. On first visit they see a pre-seeded sample map — a title, four skill cards (SPEAKING / LISTENING / READING / WRITING), a few sticky notes, and connectors — so the purpose is obvious at a glance.

**Why this priority**: Without a discoverable entry and non-empty first run, users ignore the feature.

**Independent Test**: A fresh user signs in, clicks Progress, sees the sample map. Reload shows the same state. Delete everything and reload — the canvas stays empty (seed does not re-run).

**Acceptance Scenarios**:

1. **Given** a signed-in user who has never opened the Skill Map, **When** they click "Progress" in the sidebar, **Then** they land on the map route and see the seeded sample layout.
2. **Given** any page, **When** the user looks at the sidebar, **Then** an "Insights" section with a "Progress" item carrying a "NEW" badge is visible.
3. **Given** a user has edited the map, **When** they reopen it later, **Then** their last saved state loads — never the sample layout again.

---

### User Story 2 - Build a map with text, stickies, shapes, and connectors (Priority: P1)

The user places sticky notes in several colors, drops labeled shapes (rect/ellipse/diamond), writes free-floating text, and draws connectors (straight or orthogonal).

**Why this priority**: Core feature. Without node creation, editing, and connecting, there is no map.

**Independent Test**: From a blank canvas, place one of each node type, connect them, move/edit them — without reading instructions beyond the visible toolbar.

**Acceptance Scenarios**:

1. **Given** a node-creating tool is active, **When** the user clicks empty canvas, **Then** a new node appears at that location and enters edit mode.
2. **Given** a node is selected, **When** the user drags a corner handle, **Then** it resizes, respecting a minimum size.
3. **Given** a node is hovered/selected, **When** the user drags from one of its four edge ports to another node, **Then** a connector is created, anchored to the target side nearest the drop point.
4. **Given** an orthogonal connector is selected, **When** the user drags a bend handle, **Then** the segment moves along a fixed axis without flipping or duplicating bends.
5. **Given** the connector-mode toggle is flipped, **When** the user creates a new connector, **Then** it uses the new mode; existing connectors keep their original mode.
6. **Given** a sticky or text node, **When** the user double-clicks and types, **Then** content updates in place and commits on blur or Escape.

---

### User Story 3 - Pan and zoom a large canvas (Priority: P1)

Users pan via Space+drag, middle-click drag, or Hand tool; zoom via Ctrl/Cmd+wheel (zoom-to-cursor); reset via the bottom-right control. A subtle dot grid scales with zoom.

**Why this priority**: Without reliable navigation on an infinite canvas, users lose their work off-screen.

**Independent Test**: Zoom to 200%, pan elsewhere, click reset — all content is visible again.

**Acceptance Scenarios**:

1. **Given** the canvas, **When** the user holds Space and drags, **Then** the canvas pans and the cursor reflects pan state.
2. **Given** the user holds Ctrl/Cmd and scrolls, **When** the wheel turns, **Then** zoom changes and the point beneath the cursor stays under the cursor.
3. **Given** the reset control is clicked, **Then** the viewport returns to default position and zoom.
4. **Given** two-finger trackpad scroll (no modifier), **Then** the canvas pans rather than zooms.

---

### User Story 4 - Select, delete, and undo (Priority: P1)

Users select single/multiple items (including marquee), delete safely, and undo/redo mistakes.

**Why this priority**: Without undo/redo, users won't trust the canvas to experiment — which is the point.

**Independent Test**: Create 5 nodes + 3 connectors. Marquee-select 3 nodes, delete — touching connectors disappear too. Undo. Redo. State matches.

**Acceptance Scenarios**:

1. **Given** Select tool, **When** the user drags on empty canvas, **Then** a marquee selects intersecting nodes on release; Shift makes it additive.
2. **Given** nodes are selected, **When** Delete/Backspace is pressed, **Then** those nodes are removed along with any connectors that reference them.
3. **Given** a connector is selected, **When** Delete/Backspace is pressed, **Then** only that connector is removed.
4. **Given** any state-changing action, **When** the user presses Ctrl/Cmd+Z, **Then** it reverts. **When** Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y, **Then** it reapplies.
5. **Given** dozens of actions, **When** the user undoes repeatedly, **Then** undo keeps working up to at least 80 discrete actions.

---

### User Story 5 - Persistence across sessions (Priority: P1)

Edits save in the background; returning later loads the last saved state. Interruptions cost at most the last idle window of edits.

**Why this priority**: A personal map that silently disappears is worse than no map.

**Independent Test**: Edit, wait ~1s, close tab, reopen — changes are present.

**Acceptance Scenarios**:

1. **Given** an edit occurs, **When** ~0.5s passes with no further edits, **Then** the change is persisted to the server.
2. **Given** rapid edits, **When** they occur in a burst, **Then** a single save fires after the debounce, not one per keystroke.
3. **Given** a reload, **Then** the map reflects the latest persisted state for that user.
4. **Given** the same account open in two tabs, **When** one edits and the other reloads, **Then** the second tab shows the first tab's state. Simultaneous edits resolve as last-write-wins.

---

### User Story 6 - Keyboard shortcuts for power users (Priority: P2)

Users switch tools, pan, delete, and undo without touching the toolbar.

**Why this priority**: Not required for MVP; speeds up repeat users.

**Independent Test**: Complete an editing session (create, connect, move, delete, undo) using only the keyboard.

**Acceptance Scenarios**:

1. **Given** canvas focus, **When** the user presses `V`/`H`/`T`/`S`, **Then** Select/Hand/Text/Sticky tool activates.
2. **Given** the user is typing in a node, **When** they press letters that would be shortcuts, **Then** those shortcuts do NOT fire.
3. **Given** a selection, **When** Escape is pressed, **Then** selection clears (or exits edit mode if editing).

---

### User Story 7 - Right-click context menu (Priority: P3)

Right-click on empty canvas opens a quick menu: Add sticky / text / shape / Undo / Redo / Reset view.

**Why this priority**: Nice-to-have — toolbar and shortcuts already cover the actions.

**Acceptance Scenarios**:

1. **Given** the user right-clicks empty canvas, **When** the menu appears, **Then** picking an Add item places the node at the click location.
2. **Given** the menu is open, **When** the user presses Escape or clicks outside, **Then** the menu closes with no action.

---

### Edge Cases

- Unauthenticated user hits the map route → redirect to sign-in like other protected routes.
- Server returns no saved map → seeded sample is returned.
- User deletes everything → canvas stays empty on reload; seed does not re-run.
- Rapid editing → saves are coalesced via debounce.
- Save fails / offline → local edits preserved in-session; client retries; user not blocked.
- Same user in two tabs → last-write-wins; no corruption; no merge in Phase 1.
- Payload exceeds hard caps → server rejects; prior saved state preserved; user informed non-destructively.
- Deleting a node → connectors referencing it are removed in the same action (no orphans).
- Node in text-edit mode → its own mousedown does not start a drag.
- Connector endpoint dropped on empty space → snaps back to prior anchor; never orphaned.
- Dark mode → background/dot/connector-stroke swap; sticky/shape fills stay vivid.

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & Entry**

- **FR-001**: The sidebar MUST show a new "Insights" section containing a "Progress" item with a "NEW" badge.
- **FR-002**: Clicking Progress MUST navigate to the Skill Map page.
- **FR-003**: The Skill Map page MUST require authentication; unauthenticated users are redirected to sign-in.

**Canvas Viewport**

- **FR-004**: The page MUST present an infinite pan/zoom canvas.
- **FR-005**: Users MUST be able to pan via Space+drag, middle-click drag, or the Hand tool.
- **FR-006**: Users MUST be able to zoom via Ctrl/Cmd+wheel; the point under the cursor MUST remain under the cursor after zoom.
- **FR-007**: Two-finger trackpad scrolling (no modifier) MUST pan, not zoom.
- **FR-008**: Zoom MUST be bounded (very small fit-all at low end; comfortable close-up at high end).
- **FR-009**: The canvas MUST display a subtle dot grid that scales with zoom.
- **FR-010**: The canvas MUST provide on-screen zoom controls (out / % / in / reset).

**Node Types**

- **FR-011**: The system MUST support three node types: **Text**, **Sticky**, **Shape**.
- **FR-012**: Text nodes MUST display plain editable text with optional weight/size/muted variations.
- **FR-013**: Sticky notes MUST use a handwritten-style typeface and offer at least six preset colors via a toolbar submenu.
- **FR-014**: Shape nodes MUST support at least rectangle/ellipse/diamond variants and four preset fill colors, with an editable center label.
- **FR-015**: Every node MUST have position, width, height, and text content, positioned absolutely in canvas coordinates.

**Node Interaction**

- **FR-016**: Click selects; Shift-click adds/removes from the selection.
- **FR-017**: Double-click enters edit mode; blur or Escape commits.
- **FR-018**: Dragging a selected node moves it; multi-selection drags together by the same delta.
- **FR-019**: Each selected node MUST expose four corner resize handles; a minimum usable size MUST be enforced.
- **FR-020**: Delete/Backspace removes selected nodes AND any connectors touching them.
- **FR-021**: Dragging on empty canvas with the Select tool creates a marquee selection; Shift makes it additive.
- **FR-022**: While a node is in edit mode, its own mousedown MUST NOT start a drag.

**Connectors**

- **FR-023**: On hover/select, a node exposes four connection ports (centers of its four edges).
- **FR-024**: Dragging from a port and dropping on a node creates a connector anchored to the target side nearest the drop point.
- **FR-025**: Connectors are stably anchored to a specific side on each end; moving nodes MUST NOT auto-reroute to a different side.
- **FR-026**: The toolbar MUST provide a toggle between **straight curve** and **orthogonal elbow**. New connectors use the current mode; existing connectors keep their own.
- **FR-027**: Connectors MUST render an arrowhead at the target end.
- **FR-028**: A selected orthogonal connector MUST expose draggable bend handles on internal segments; the drag axis MUST be locked at drag start and MUST NOT flip or multiply bends mid-drag.
- **FR-029**: A selected connector MUST expose endpoint handles; dragging re-anchors (snap to nearest side on drop) or reverts to prior anchor on empty drop — no orphaned endpoints.
- **FR-030**: Node selection and connector selection are mutually exclusive.

**Tools & Toolbar**

- **FR-031**: The floating toolbar MUST provide: Select, Hand, Sticky (color submenu), Shape (shape + fill submenu), Text, connector-mode toggle. Placeholder entries (e.g., Comment, More) MAY appear but MUST be no-ops in Phase 1.
- **FR-032**: With a node-creating tool active, clicking empty canvas places a new node at that position and enters edit mode.
- **FR-033**: The active tool MUST be visibly distinguished.

**Keyboard Shortcuts**

- **FR-034**: The system MUST support: `V` (Select), `H` (Hand), `T` (Text), `S` (Sticky), Space-hold (temporary pan), Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y (redo), Delete/Backspace (delete), Escape (clear selection / exit edit / close menu).
- **FR-035**: Shortcuts MUST be suppressed while typing in an input or node edit mode.

**Context Menu**

- **FR-036**: Right-click on empty canvas MUST open a menu: Add sticky / Add text / Add shape / Undo / Redo / Reset view. Add actions place the node at the click location.

**Undo / Redo**

- **FR-037**: The system MUST support at least 80 discrete undo entries per session.
- **FR-038**: Snapshots are taken at action boundaries (create, delete, move-start, resize-start, port-drop, endpoint re-anchor, bend-drag-start), NOT per-frame during drags.

**Persistence**

- **FR-039**: Each user MUST have their own saved Skill Map; maps MUST NOT be visible cross-user.
- **FR-040**: Local edits MUST autosave to the server after a short debounce (~0.5s of inactivity), with no explicit save action.
- **FR-041**: On first load with no saved map, the server MUST return a seeded sample: title, four skill cards (SPEAKING/LISTENING/READING/WRITING) in distinct colors, three example stickies, at least three text labels, and a mix of straight + orthogonal connectors.
- **FR-042**: Once the user has any saved state (including explicit empty), the seed MUST NOT re-apply on subsequent loads.
- **FR-043**: The server MUST validate and reject saves exceeding a hard cap on total nodes/connectors; prior saved state remains intact on rejection.
- **FR-044**: Concurrent same-user edits across tabs resolve as last-write-wins; the system MUST NOT corrupt the document.

**Theming**

- **FR-045**: The page MUST respect the app's light/dark toggle; canvas background, dot grid, and connector stroke switch with theme; sticky/shape fills remain vivid in both modes.

**Out of Scope (Phase 1)**

- Integration with decks, exercises, or progress data.
- Collaboration, presence, or real-time sync.
- Comments, reactions, social features.
- Export (PNG/PDF/etc).
- Multiple maps per user (exactly one map in Phase 1).
- Rich text, images, or media in nodes.

### Key Entities

- **Skill Map**: A user's personal diagram. One per user. Has a title, a list of nodes, a list of connectors, and a last-updated timestamp.
- **Node**: A visual element. Has id, type (text/sticky/shape), position, size, text, and type-specific visual attributes (sticky color, shape variant, fill, font weight/size).
- **Connector**: A directed link. Has id, source node + source side, target node + target side, routing mode (straight/orthogonal), and optional per-segment overrides for manual bend positions. Renders with an arrowhead at the target end.
- **Undo/Redo History**: In-memory per session; not persisted.
- **Viewport State**: Current pan + zoom. Client-only; not persisted server-side in Phase 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can locate and open the Skill Map within 10 seconds of landing on any app page.
- **SC-002**: No first-time user ever sees a blank canvas — the seeded sample is always present on first visit.
- **SC-003**: From a blank state, a user can place one of each node type, draw at least one connector of each mode, move nodes, and delete one, within 2 minutes using only the visible UI.
- **SC-004**: Autosave captures the latest edits within 1 second of the last edit (verified by reload).
- **SC-005**: Sudden tab close after a 1-second idle never costs the user more than that idle window's edits.
- **SC-006**: Undo depth supports at least 80 discrete actions; undo/redo feel instantaneous to the user.
- **SC-007**: Pan and zoom remain visibly smooth on a map of at least 100 nodes + 200 connectors on a mid-range laptop.
- **SC-008**: The new sidebar entry drives a meaningful share of active users to open the canvas in its first week (baseline for Phase 2; exact threshold set at launch).
- **SC-009**: Zero data-loss incidents attributable to autosave during a 4-week post-launch monitoring window. Zero cross-user data leaks at any time.
- **SC-010**: A returning user sees exactly the state they last edited (modulo the autosave debounce window).

## Assumptions

- The app already has authenticated sessions, a sidebar layout, a light/dark theme toggle, and a per-user data layer; this feature reuses them.
- One map per user is sufficient for Phase 1; named maps / folders / multi-map are deferred.
- The seed content is prescribed by the design handoff; no per-user personalization of the seed.
- Viewport state is client-only; cross-device viewport restoration is not required.
- Last-write-wins is acceptable for same-user multi-tab editing; CRDTs/OT are deferred.
- Performance targets personal maps (tens to low hundreds of nodes); large enterprise canvases are not a Phase 1 goal.
- The "NEW" sidebar badge is a launch-period marker; its removal schedule is owner-managed and out of scope here.
