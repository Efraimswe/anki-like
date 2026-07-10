# Plan — Redesign of the Plan-page Goal Card (view: Design, phase A)

Project: `anki-like` · Surface: `/plan` goal card · Stack: pure existing tokens + CSS (globals.css) + React 19 client components. No new deps. Data/API/hooks untouched.

Gate for the execution chunk: `npx tsc --noEmit` + `pnpm lint`. **No `pnpm build`** (dev server is live).

---

## 0. Design read + diagnosis (audit-first)

**Reading this as:** app UI (product register) for a Duolingo-style language app. The goal card is a *quest*: one big goal (a level to reach — the RED zone) broken into steps (medium goals — the GREEN zone). Emotion: "this is my quest, I can see my progress, tapping feels juicy." Style is the app's own gamified/clay-ish language: chunky rounded shapes, flat bright fills, `font-display` extrabold, hard `0 Npx 0` bottom edges (same language as `.btn-3d` / `.duo-node`). Borders and hard bottom-lips are justified *by this chosen style*, used minimally (reviewer #21 satisfied consciously).

**Why the current card reads "колхозно" (root causes, from the skills):**

1. **Nested cards, 3 levels deep** (impeccable: *nested cards are always wrong*). Neutral gray `.plan-goal-card` → red `.plan-goal-row-card` plaque → green `.plan-row-card` plaques. Every level has its own bg + border + shadow, so nothing reads as one object.
2. **Border-as-default slop** (reviewer #21). Container border + red-plaque border + each green-plaque border + trash-puck border + plus-puck border + chevron-bar border. Six competing outlines.
3. **Footer = three unrelated shapes in a row** (reviewer #4, zone/shape conflict). White circular trash puck | bordered gray chevron *bar* | white circular plus puck. Different shapes, different fills, no composition.
4. **Ungainly medium row.** Checkbox stacked *on top of* a trash puck (`flex-col`), text floating to the right. Reads as two random circles + text.
5. **No hierarchy or progress.** Red strip and green strips just stack; nothing tells the user "3 of 5 done."

**Fix = flatten to 2 levels (card → rows) and compose one cohesive object:**
- The **card itself is the big goal** (white surface, soft red-tint identity), not a neutral box holding a red box.
- The **header** is the red zone (soft red wash + red checkbox + red progress bar + quiet action cluster).
- The **steps** are flat green rows (fill + spacing separate them — no borders, no nested plaques).
- The **big wide chevron** becomes a clean full-width **drawer pull** at the bottom (no gray backing bar, no flanking pucks). It stays big/central/crossfade per mandate.
- **Trash + plus** move to a quiet top-right cluster in the header (accessible while collapsed, as required), freeing the bottom for the single pull affordance.
- Add a **progress bar + "X / N steps"** — the single most on-brand Duolingo element, using only existing data (`mediumGoals[].completed`).

---

## 1. Composition sketches

### Desktop / tablet (card lives in `max-w-2xl` ≈ 672px, centered)

**Collapsed**
```
┌──────────────────────────────────────────────────────────┐  ← .goal-card (white, 2px red-tint border,
│  ╭── red wash header ─────────────────────────────────╮   │     radius 20, hard 0 2px 0 bottom lip)
│  │ (◉)  Reach B1 conversational Spanish      ( ＋ )( 🗑 )│  │  ◉ = red checkbox (28px)
│  │      ▓▓▓▓▓▓▓▓▓░░░░░░              3 / 5 steps        │  │  progress bar (red) + count
│  ╰──────────────────────────────────────────────────╯   │
│  · · · · · · · · · · · ⌄ · · · · · · · · · · · · · · · ·  │  ← .goal-pull (full width, transparent,
└──────────────────────────────────────────────────────────┘     wide shallow chevron, hairline above)
```

**Expanded**
```
┌──────────────────────────────────────────────────────────┐
│  ╭── red wash header ─────────────────────────────────╮   │
│  │ (◉)  Reach B1 conversational Spanish      ( ＋ )( 🗑 )│  │
│  │      ▓▓▓▓▓▓▓▓▓░░░░░░              3 / 5 steps        │  │
│  ╰──────────────────────────────────────────────────╯   │
│  ┌── green step ───────────────────────────────────┐     │  ← .goal-step (light-green fill, radius 14,
│  │ (✓) Finish 20 lessons on the food unit      (🗑) │     │     NO border, gap 8 between rows)
│  └──────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────┐     │
│  │ (○) Hold a 5-minute chat with a tutor        (🗑) │     │
│  └──────────────────────────────────────────────────┘     │
│  ┌── new-step input ────────────────────────────────┐     │  ← .goal-step-add (only while adding)
│  │  New step…                                 ( ✓ )( ✕ )│  │
│  └──────────────────────────────────────────────────┘     │
│  · · · · · · · · · · · ∧ · · · · · · · · · · · · · · · ·  │  ← .goal-pull (chevron crossfades to ∧)
└──────────────────────────────────────────────────────────┘
```

### Mobile (~375px, card ≈ 343px)

Layout is the **same single-column vertical stack** (see §6 for why no reflow is needed). Only difference: the title wraps to max 2 lines; action cluster is protected by `min-w-0` on the title so trash/plus never get pushed off-screen (reviewer #2).
```
┌───────────────────────────────────────┐
│ ╭ red wash header ───────────────────╮ │
│ │ (◉) Reach B1 conversational    ＋ 🗑│ │  ← title wraps to 2 lines, actions stay top-right
│ │     Spanish                        │ │
│ │     ▓▓▓▓▓▓░░░░░        3 / 5 steps  │ │
│ ╰────────────────────────────────────╯ │
│ · · · · · · · · ⌄ · · · · · · · · · · · │
└───────────────────────────────────────┘
```

---

## 2. Token values (concrete)

**Radii (shape-consistency lock):** card `20px` · step / input / progress-track `14px` · progress-fill `999px` · icon-button visible circle `50%`. One coherent scale, no `24/28/32` over-rounding.

**Spacing:** header padding `16px 18px` · body inner padding `4px 14px 14px` · step gap `8px` (`.goal-steps` uses `gap`) · step padding `10px 12px` · progress bar margin-top `12px` · count margin-top `6px` · pull height `40px`.

**Type:**
- Big-goal title: `font-display`, weight `800`, `1.125rem` (18px), `line-height 1.25`, clamp 2 lines.
- Step title: weight `700`, `0.9rem` (14px), `line-height 1.35`.
- Steps count: weight `800`, `0.75rem` (12px).

**Sizes / hit targets:** big checkbox 44px hit / 28px visible (md, unchanged) · step checkbox 44px hit / 24px visible (sm, unchanged) · header icon-buttons 44px hit / 32px visible circle on hover · step trash 40px hit / 28px visible on hover · chevron arc `width: min(52%, 180px)`, `height 20px`, non-scaling stroke `4.5`.

**Shadows:** card bottom lip `0 2px 0 <red-tint>` (hard, no blur — Duolingo physical card; NOT the banned soft ghost-card). Steps: **none** (flat, separated by fill+gap). Icon buttons: none by default; hover fills a tinted circle only.

**Motion curves (existing tokens):** `--ease-out-strong: cubic-bezier(0.23,1,0.32,1)`. All UI transitions 120–260ms, transform/opacity/color only, ease-out. Every motion has a `prefers-reduced-motion` fallback.

### Colors + contrast math (WCAG)

| Element | Color | On background | Ratio | Verdict |
|---|---|---|---|---|
| Card border | `color-mix(--duo-red 16%, #fff)` ≈ #FEDCDC | (decorative outline) | n/a | red identity, recessive |
| Card bottom lip | `color-mix(--duo-red 20%, #fff)` ≈ #FED6D6 | (decorative) | n/a | hard 3D edge |
| Header wash bg | `color-mix(--duo-red 6%, #fff)` ≈ #FFF1F1 | card white | n/a | soft red zone |
| Big-goal title | `--ink` #4B4B4B | #FFF1F1 wash | ≈ 8.4:1 | pass |
| Steps count | `--ink` #4B4B4B | #FFF1F1 wash | ≈ 8.4:1 | pass (kept ink, not muted, on purpose) |
| Progress track | `color-mix(--duo-red 14%, #fff)` | on wash | n/a | decorative |
| Progress fill | `--duo-red` #FF4B4B | on track | ≥3:1 vs track | pass (graphical) |
| Step title | `--ink` #4B4B4B | `color-mix(green 9%,#fff)` ≈ #EEF9E6 | ≈ 8.0:1 | pass |
| Chevron (default) | `--ink-muted` #777 | white | ≈ 4.6:1 | pass (meaningful control ≥3:1) |
| Chevron (hover) | `--ink` #4B4B4B | white | ≈ 9:1 | pass |
| Icon-btn glyph | `--ink-muted` #777 → `--duo-red`/`--duo-green` on hover | wash/white | ≥4.5 / brand | pass |

Checkbox visuals (`GoalCheckbox`) are **unchanged** — the white-check-on-brand-fill is the app-wide established pattern (SkillCard, LevelCelebration); changing it here would create cross-screen inconsistency (reviewer #14).

---

## 3. Markup skeletons (per component)

> Only structure/classes change. All hooks, handlers, state, delete-animation logic, and `ConfirmDialog` usage are preserved exactly. `GoalCheckbox.tsx` and `GoalLabel.tsx` are **unchanged**.

### `PlanGoalCard.tsx`
```tsx
// ChevronArc component: UNCHANGED (same wide crossfade ∨/∧ SVG).
// Add derived progress from existing data — no new hooks:
const total = goal.mediumGoals.length;
const done = goal.mediumGoals.filter((m) => m.completed).length;
const pct = total === 0 ? 0 : Math.round((done / total) * 100);

return (
  <div className="goal-card-collapse" data-open={!deleting}>
    <div className="goal-card-collapse-inner">
      <div className={`goal-card${deleting ? ' goal-card-fade' : ''}`} data-done={goal.completed || undefined}>

        {/* ── HEADER = red zone ─────────────────────────── */}
        <div className="goal-card-head">
          <div className="goal-card-head-row">
            <GoalCheckbox
              checked={goal.completed}
              onToggle={() => toggleBig.mutate({ id: goal.id, completed: !goal.completed })}
              accent="var(--duo-red)"
            />
            <GoalLabel
              text={goal.title}
              completed={goal.completed}
              className="goal-card-title font-display"
            />
            <div className="goal-card-actions">
              <button type="button" className="goal-icon-btn goal-icon-btn--confirm"
                aria-label="Add a step"
                onClick={() => { setOpen(true); setAdding(true); }}>
                <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <button type="button" className="goal-icon-btn goal-icon-btn--danger"
                aria-label="Delete goal" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* progress */}
          <div className="goal-progress" aria-hidden="true">
            <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="goal-steps-count">
            {total === 0 ? 'No steps yet' : `${done} / ${total} steps`}
          </p>
        </div>

        {/* ── BODY = green zone (collapsible) ───────────── */}
        <div className="goal-body" data-open={open}>
          <div className="goal-body-inner">
            {total === 0 && !adding && (
              <p className="goal-empty">No steps yet. Tap ＋ to add one.</p>
            )}
            <ul className="goal-steps">
              {goal.mediumGoals.map((m) => (
                <MediumGoalRow key={m.id} bigGoalId={goal.id} medium={m} />
              ))}
            </ul>
            {adding && <AddMediumInput bigGoalId={goal.id} onDone={() => setAdding(false)} />}
          </div>
        </div>

        {/* ── PULL = the one big expand affordance ──────── */}
        <button type="button" className="goal-pull"
          aria-label={open ? 'Collapse goal' : 'Expand goal'}
          aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronArc open={open} />
        </button>

        {confirmDelete && (
          <ConfirmDialog title="Delete goal?" message="Do you really want to delete this goal?"
            confirmLabel="Yes" cancelLabel="No"
            onCancel={() => setConfirmDelete(false)} onConfirm={handleConfirmDelete} />
        )}
      </div>
    </div>
  </div>
);
```
Notes: `ChevronArc` keeps class `goal-chevron-icon` / path classes (renamed section in CSS below preserves those exact names). `data-done` lets the header fade slightly when the whole goal is complete (polish, optional to keep).

### `MediumGoalRow.tsx` — horizontal, flat green row
```tsx
// Logic (toggle, confirm, delete phases, particles, check-flash) UNCHANGED.
// Only the returned markup restructures: checkbox + label + trash on ONE row.
return (
  <li className="goal-step" data-phase={phase}>
    <div className="goal-step-row">
      <GoalCheckbox
        checked={medium.completed}
        onToggle={() => toggleMed.mutate({ id: medium.id, completed: !medium.completed })}
        accent="var(--duo-green)"
        size="sm"
      />
      <GoalLabel text={medium.title} completed={medium.completed} className="goal-step-title" />
      <button type="button" className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--danger"
        aria-label="Delete step" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="h-[15px] w-[15px]" aria-hidden="true" />
      </button>
    </div>

    {showDeleteEffects && (
      <>
        <span className="goal-step-particles" aria-hidden="true">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <span key={i} style={{ '--a': `${i * 30}deg` } as CSSProperties} />
          ))}
        </span>
        <span className="goal-step-flash" aria-hidden="true"><Check /></span>
      </>
    )}
    {confirmDelete && ( /* ConfirmDialog — UNCHANGED */ )}
  </li>
);
```
Removes the `flex-col` checkbox-over-trash stack. Delete-effect class names renamed `plan-particles`→`goal-step-particles`, `plan-check-flash`→`goal-step-flash` (CSS below).

### `AddMediumInput.tsx` — inline green-tinted new-step row
```tsx
// Logic UNCHANGED. Wrap in a styled row that matches step language:
return (
  <div className="goal-step-add">
    <input ref={inputRef} type="text" className="goal-input" placeholder="New step…"
      value={value} onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone(); }} />
    <div className="goal-step-add-actions">
      <button type="button" className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--confirm"
        aria-label="Create step" disabled={!value.trim()} onClick={submit}>
        <Check className="h-[15px] w-[15px]" aria-hidden="true" />
      </button>
      <button type="button" className="goal-icon-btn goal-icon-btn--sm" aria-label="Cancel" onClick={onDone}>
        <X className="h-[15px] w-[15px]" aria-hidden="true" />
      </button>
    </div>
  </div>
);
```

---

## 4. CSS — full replacement of the `Plan (goals)` section

Replace globals.css lines **586–843** (the `/* Plan (goals) */` block, from `.goal-aim-btn` through the last `@keyframes plan-check`) with the block below. **Do not touch `.goal-aim-btn`** — keep it exactly as-is at the top of the block (it belongs to the Skills page AimButton, not the plan card). Everything after it is rewritten.

Also update the reduced-motion block near line 414–420: replace the `.goal-chevron-btn` selectors with `.goal-pull`, keep `.goal-icon-btn`.

```css
/* ── keep .goal-aim-btn (lines 590–608) unchanged above this point ── */

/* ════════════════════════════════════════════════════════════
   Plan · goal card (redesign) — flat 2-level: card → rows
   Red = big goal (header zone), Green = steps (rows)
   ════════════════════════════════════════════════════════════ */

/* delete-collapse wrapper (unchanged behaviour) */
.goal-card-collapse { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 300ms ease; }
.goal-card-collapse[data-open="false"] { grid-template-rows: 0fr; }
.goal-card-collapse-inner { overflow: hidden; min-height: 0; }
.goal-card-fade { animation: goal-card-fade-out 300ms ease forwards; }

/* THE CARD = the big goal. White surface, soft red-tint identity, hard bottom lip. */
.goal-card {
  background: #fff;
  border: 2px solid color-mix(in srgb, var(--duo-red) 16%, #fff);
  border-radius: 20px;
  box-shadow: 0 2px 0 color-mix(in srgb, var(--duo-red) 20%, #fff);
  overflow: hidden;                       /* clip header wash to rounded top */
}
.goal-card[data-done] .goal-card-head { opacity: 0.62; }

/* HEADER = red zone */
.goal-card-head {
  background: color-mix(in srgb, var(--duo-red) 6%, #fff);
  padding: 16px 18px;
}
.goal-card-head-row { display: flex; align-items: flex-start; gap: 10px; }
.goal-card-title {
  flex: 1 1 auto; min-width: 0;           /* protects action cluster (reviewer #2) */
  font-weight: 800; font-size: 1.125rem; line-height: 1.25; color: var(--ink);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; word-break: break-word; padding-top: 3px;
}
.goal-card-actions { display: flex; gap: 2px; flex: 0 0 auto; margin: -4px -6px 0 0; }
.goal-card-head .goal-checkbox::before { border-color: color-mix(in srgb, var(--duo-red) 40%, #fff); }

/* progress */
.goal-progress {
  margin-top: 12px; height: 8px; border-radius: 999px;
  background: color-mix(in srgb, var(--duo-red) 14%, #fff); overflow: hidden;
}
.goal-progress-fill {
  height: 100%; border-radius: inherit; background: var(--duo-red);
  transition: width 320ms var(--ease-out-strong);
}
.goal-steps-count { margin-top: 6px; font-weight: 800; font-size: 0.75rem; color: var(--ink); }

/* BODY = green zone (collapsible) */
.goal-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms ease-out; }
.goal-body[data-open="true"] { grid-template-rows: 1fr; }
.goal-body-inner { overflow: hidden; min-height: 0; }
.goal-body[data-open="true"] .goal-body-inner { padding: 4px 14px 14px; }
.goal-empty { padding: 10px 4px 4px; font-weight: 700; font-size: 0.85rem; color: var(--ink-muted); }
.goal-steps { display: flex; flex-direction: column; gap: 8px; }

/* STEP = flat green row, no border, separated by fill + gap */
.goal-step { position: relative; display: grid; grid-template-rows: 1fr; overflow: hidden; }
.goal-step-row {
  display: flex; align-items: center; gap: 10px;
  background: color-mix(in srgb, var(--duo-green) 9%, #fff);
  border-radius: 14px; padding: 10px 12px;
}
.goal-step-row .goal-checkbox::before { border-color: color-mix(in srgb, var(--duo-green) 34%, #fff); }
.goal-step-title { flex: 1 1 auto; min-width: 0; font-weight: 700; font-size: 0.9rem; line-height: 1.35;
  color: var(--ink); word-break: break-word; }
.goal-step[data-phase="deleting"] { animation: goal-step-collapse 800ms ease forwards; }
.goal-step[data-phase="deleting"] > .goal-step-row { animation: goal-step-shrink 800ms ease forwards; }

/* new-step input row */
.goal-step-add {
  margin-top: 8px; padding: 10px 12px; border-radius: 14px;
  background: color-mix(in srgb, var(--duo-green) 9%, #fff);
  display: flex; flex-direction: column; gap: 8px;
}
.goal-step-add-actions { display: flex; gap: 4px; justify-content: flex-end; }
.goal-input {
  width: 100%; border: 2px solid var(--rule); border-radius: 12px; padding: 0.55rem 0.7rem;
  font: inherit; color: var(--ink); background: #fff;
}
.goal-input:focus { border-color: var(--duo-green); outline: none; }
.goal-input::placeholder { color: var(--ink-soft); }

/* PULL = the single big expand affordance (wide chevron, no backing bar) */
.goal-pull {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 40px; background: transparent;
  border: none; border-top: 1px solid color-mix(in srgb, var(--duo-red) 10%, #fff);
  color: var(--ink-muted); cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .goal-pull:hover { background: var(--surface-hover); color: var(--ink); }
}
.goal-pull:active { color: var(--ink); }
.goal-pull:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: -3px; border-radius: 0 0 18px 18px; }
.goal-chevron-icon { width: min(52%, 180px); height: 20px; overflow: visible; }
.goal-chevron-icon-path {
  fill: none; stroke: currentColor; stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round;
  opacity: 0; transform-box: fill-box; transform-origin: center;
  transition: opacity 140ms ease-out, transform 140ms ease-out;
}
.goal-chevron-icon-path--visible {
  opacity: 1; transform: translateY(0);
  transition: opacity 160ms ease-out 160ms, transform 160ms ease-out 160ms;
}
.goal-chevron-icon-path--down:not(.goal-chevron-icon-path--visible) { transform: translateY(-2px); }
.goal-chevron-icon-path--up:not(.goal-chevron-icon-path--visible) { transform: translateY(2px); }

/* checkbox — kept from existing system (do not restyle the visual) */
.goal-checkbox { position: relative; width: 44px; height: 44px; display: grid; place-items: center; color: transparent; flex: 0 0 auto; }
.goal-checkbox::before {
  content: ""; position: absolute; inset: 8px; border-radius: 50%;
  border: 2px solid var(--rule); background: transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s var(--ease-out-strong);
}
.goal-checkbox--sm::before { inset: 10px; }
.goal-checkbox[aria-checked="true"]::before { background: var(--accent, var(--duo-green)); border-color: transparent; }
.goal-checkbox svg { position: relative; z-index: 1; color: #fff; }
.goal-checkbox:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; border-radius: 50%; }
/* toggle feedback: reuse the existing global .pop class (globals.css line 406) — GoalCheckbox already adds it. Do NOT add a forked keyframe. */

/* icon buttons — ghost; tinted circle appears only on hover/focus */
.goal-icon-btn {
  position: relative; width: 44px; height: 44px; display: grid; place-items: center;
  color: var(--ink-muted); background: transparent; border: none; cursor: pointer;
  transition: transform 0.12s var(--ease-out-strong), color 0.15s ease;
}
.goal-icon-btn::before {
  content: ""; position: absolute; inset: 6px; border-radius: 50%;
  background: transparent; transition: background-color 0.15s ease; z-index: 0;
}
.goal-icon-btn svg { position: relative; z-index: 1; }
.goal-icon-btn--sm { width: 40px; height: 40px; }
.goal-icon-btn--sm::before { inset: 6px; }
@media (hover: hover) and (pointer: fine) {
  .goal-icon-btn:hover:not(:disabled)::before { background: var(--surface-hover); }
  .goal-icon-btn--danger:hover:not(:disabled) { color: var(--duo-red); }
  .goal-icon-btn--danger:hover:not(:disabled)::before { background: var(--danger-soft); }
  .goal-icon-btn--confirm:hover:not(:disabled) { color: var(--duo-green); }
  .goal-icon-btn--confirm:hover:not(:disabled)::before { background: var(--duo-green-haze); }
}
.goal-icon-btn:active:not(:disabled) { transform: scale(0.9); }
.goal-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.goal-icon-btn:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; border-radius: 50%; }

/* delete FX (renamed, behaviour unchanged) */
.goal-step-particles { position: absolute; inset: 0; pointer-events: none; }
.goal-step-particles span {
  position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; border-radius: 50%;
  background: var(--duo-green); animation: goal-step-particle 0.5s ease-out forwards;
}
.goal-step-flash {
  position: absolute; left: 50%; top: 50%; width: 28px; height: 28px; display: grid; place-items: center;
  border-radius: 50%; background: var(--duo-green); color: #fff;
  transform: translate(-50%, -50%) scale(0); animation: goal-step-flash-kf 0.45s ease-out 0.15s both; pointer-events: none;
}
.goal-step-flash svg { width: 16px; height: 16px; }

@keyframes goal-card-fade-out { to { opacity: 0; transform: scale(0.96); } }
@keyframes goal-step-shrink { 0%{opacity:1;transform:scale(1)} 20%{opacity:1;transform:scale(0.85)} 60%,100%{opacity:0;transform:scale(0.85)} }
@keyframes goal-step-collapse { 0%,60%{grid-template-rows:1fr} 100%{grid-template-rows:0fr} }
@keyframes goal-step-particle {
  0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(1)}
  100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateY(-32px) scale(0.3)}
}
@keyframes goal-step-flash-kf {
  0%{opacity:0;transform:translate(-50%,-50%) scale(0)}
  60%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1)}
}

@media (prefers-reduced-motion: reduce) {
  .goal-progress-fill { transition: none; }
  .goal-icon-btn:active:not(:disabled) { transform: none; }
}
```
Note on `.pop`: confirmed present as a global class at globals.css line 406 (`animation: pop 0.28s cubic-bezier(0.34,1.56,0.64,1) both`). `GoalCheckbox` already toggles it on check. Reuse it as-is; the §4 block adds **no** checkbox-pop keyframe (reviewer #14, reuse not fork).

---

## 5. Micro-interactions (emil pass)

| Interaction | Spec | Why |
|---|---|---|
| Chevron pull hover | bg → `surface-hover`, color ink-muted → ink, 150ms ease | affordance feedback; gated behind `hover:hover` (no touch false-positives) |
| Chevron crossfade | existing ∨/∧ opacity+translateY crossfade, 140/160ms, no rotation | kept per mandate; crossfade (not rotate) reads as "same control, new state" |
| Expand/collapse | grid-rows `0fr↔1fr`, 240ms ease-out | height animates smoothly; ease-out = responsive on the frame the user watches |
| Icon button press | `scale(0.9)` active, 120ms ease-out-strong; hover fills tinted circle | buttons must feel pressed (emil); ghost-until-hover keeps header calm |
| Checkbox toggle | existing `.pop` scale 0.6→1.15→1 | juicy tactile confirm, on-brand |
| Progress fill | width transition 320ms ease-out-strong | animates when a step is checked → visible reward |
| Step enter (optional polish) | on expand, stagger rows `opacity 0→1, translateY 6px→0`, 40ms step, ease-out | list reveal reads naturally; keep subtle, drop under reduced-motion |
| Delete (card / step) | existing fade + particle burst + check-flash | kept exactly |

All transitions: transform/opacity/color only, ≤320ms, ease-out. `prefers-reduced-motion` disables transforms/particles, keeps instant state changes.

---

## 6. Responsive — 375 / 768 / 1440 (explicit)

The card is a **single-column vertical stack**; the only horizontal row is the header (`checkbox | title | actions`). It needs no per-breakpoint reflow, and here is the justification (reviewer #19/#20 — stated, not assumed):

- **375px** (card ≈ 343px): header row = checkbox 44 + gap 10 + title(flex-1, `min-w-0`) + actions 88 ≈ title gets ~190px and **wraps to max 2 lines**; `min-w-0` guarantees the ＋/🗑 cluster never gets pushed off (reviewer #2). Steps: checkbox 44 + text(flex-1 min-w-0, wraps) + trash 40 — fits, text wraps. Progress bar, pull, input: full-width, no crowding. Chevron uses `min(52%,180px)` so it never touches edges.
- **768px** (card capped at ~672 by `max-w-2xl`): identical layout, title usually 1 line, more air.
- **1440px** (card still ~672, centered): identical, generous.

No `flex-wrap` fallbacks anywhere — nothing wraps unintentionally; the single reflow (title to 2 lines) is designed, not accidental.

Zones/z-index: no new fixed/sticky zones. Card content is in normal flow. Delete particles are `position:absolute; inset:0; pointer-events:none` scoped inside `.goal-step`. The only overlay is the existing `ConfirmDialog` (its own layer, unchanged). No z-index values introduced (reviewer #16 satisfied by omission).

---

## 7. frontend-ui-design-reviewer pass (plan checked; items folded in)

- **#1 grid w/ fixed children** — n/a (no grid of fixed-size children; flex + `min-w-0`).
- **#2 flex-1+truncate w/o min-w-0** — covered: `min-w-0` on `.goal-card-title` and `.goal-step-title`.
- **#3 content under fixed zones** — n/a (no fixed zones).
- **#4 fixed-zone conflict** — resolved: removed the 3-shape footer; one bottom pull; actions in header.
- **#5 native controls** — only `<input>`, styled via `.goal-input`.
- **#6 silent actions** — toggle→`.pop` + line-through + progress bar move; add/delete have existing visible FX; all ≤320ms.
- **#7 blocking confirm()** — uses existing `ConfirmDialog` (non-blocking), unchanged.
- **#8 clipped popovers** — n/a.
- **#9 realistic content** — sketches use long titles; title clamps 2 lines, step title wraps; verified at 343px.
- **#10 states** — default/hover/active/focus-visible/disabled/completed(line-through+fade)/empty("No steps yet")/deleting all specified.
- **#11 AI-slop** — no gradients, no gradient-text, no three-identical-cards, **nested cards removed**, borders minimized and style-justified.
- **#13 a11y** — contrast table all ≥4.5 for text; `button` elements (not divs); `aria-label`/`aria-expanded` present; `focus-visible` on every control; reduced-motion block.
- **#14 cross-screen consistency** — reuse `GoalCheckbox`/`GoalLabel`/`ConfirmDialog`; reuse existing `.pop`; palette + `--ease-out-strong` from tokens only.
- **#15 magic values** — all from token scale / defined radii+spacing; no inline hex, no random offsets.
- **#16 z-index** — none introduced.
- **#17/#19/#20 responsive** — three widths designed in §6; the single reflow (title→2 lines) is explicit; no accidental wrap.
- **#21 borders-as-default** — consciously chosen: card border + hard lip are the app's Duolingo/clay language; steps have **no** border (fill+gap); icon buttons ghost. Reasoning documented in §0.
- **#22 Tailwind v4 unlayered classes** — all custom `.goal-*` classes live in globals.css as plain classes (same as the existing plan section, which already works this way — no Tailwind utility fights them because the card uses semantic classes, not utilities). Implementer: do not mix a utility like `p-4` onto elements that also get `.goal-*` padding.

**Added to plan by this pass:** explicit empty-state row (`.goal-empty`), `min-w-0` on both titles, `hover:hover` gating on hover fills, reduced-motion block, "reuse existing `.pop`" instruction, contrast math table.

---

## 8. Execution chunk (one chunk → Sonnet)

Single chunk — small surface, 4 files touched + 1 CSS section. No file overlaps to parallelize.

**Files & order:**
1. `src/app/globals.css` — replace the Plan section (lines 586–843, keeping `.goal-aim-btn` at 590–608) with §4 block; update the reduced-motion selectors (`.goal-chevron-btn`→`.goal-pull`) near line 414–420. The global `.pop` (line 406) is reused as-is for checkbox feedback — do not fork it.
2. `src/components/plan/MediumGoalRow.tsx` — restructure markup to §3 (horizontal `.goal-step-row`); rename delete-FX classes; keep all logic/handlers/ConfirmDialog.
3. `src/components/plan/AddMediumInput.tsx` — wrap in `.goal-step-add` per §3; keep logic.
4. `src/components/plan/PlanGoalCard.tsx` — restructure to §3 (header/body/pull); add derived `total/done/pct`; keep `ChevronArc`, state, timers, ConfirmDialog.
5. `GoalCheckbox.tsx`, `GoalLabel.tsx` — **no change**.

**Done criteria:**
- `/plan` renders one flat card per goal: white card, soft-red header with red checkbox + title + progress bar + count, quiet ＋/🗑 top-right, flat green step rows, one wide bottom chevron pull. No nested-card look, no footer pucks.
- Collapsed shows header + pull only; chevron pull expands/collapses with smooth height; crossfade ∨/∧ works.
- ＋ opens inline input and expands; ✓ creates, ✕/Esc cancels; trash opens confirm modal; delete animations (card fade, step particle burst) intact.
- Big + step checkboxes toggle, line-through + fade on done; progress bar/count reflect completed steps; "No steps yet" shows when empty.
- Keyboard: every control focusable with visible `focus-visible` ring; screen-reader labels present.
- Looks correct at 375 / 768 / 1440 with a long title and a full step list.

**Gates (run before reporting):** `npx tsc --noEmit` and `pnpm lint` both clean. Do **not** run `pnpm build` (dev server live). Visual check in the running dev server at the three widths.
```
```

---

## Notes for the lead
- Progress bar + "X / N steps" is the one net-new element; it uses only existing data. If the руководитель wants a pure like-for-like layout swap, it can be dropped without affecting the rest of the composition (remove `.goal-progress*` + `.goal-steps-count` + the derived vars).
- The whole `.goal-*` CSS is self-contained to the plan card; nothing else in the app references these classes (`.goal-aim-btn` excepted and preserved).
