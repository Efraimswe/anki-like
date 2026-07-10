# Plan — /plan redesign into a classic todo layout

**Вид:** Design (наложение классического todo-лейаута на существующую механику).
**Стек:** Next.js + TS + чистый CSS в `src/app/globals.css` (Tailwind-утилиты в JSX — только для страничного каркаса, вся логика вида в `.plan-*` классах).
**Инвариант:** данные/хуки/API не трогаем (`use-plan.ts`, `queries/plan.ts`, `route.ts` — без изменений). Меняем только разметку компонентов `plan/` + CSS-блок «Plan» + шапку/пустое состояние `page.tsx`.

> Предыдущие планы `plan-goals*.md` устарели — их визуальные решения (красная/зелёная плашки-зоны, огромный chevron-pull, мусорка под чекбоксом, распад в частицы) ОТМЕНЕНЫ. Ниже — новый спокойный классический список.

---

## 0. Design-решение (из `ui-ux-pro-max` + референсы Todoist/Things/TickTick/Reminders)

Рассуждение как дизайнер (тип → эмоция → стиль → язык поверхностей):
- **Тип продукта:** productivity / task-manager (цели → шаги). **Эмоция юзера:** «спокойно вижу свой план, легко отмечаю сделанное». → **Стиль: Flat / Minimal** (рекомендация `--design-system`: Flat Design, no shadows, clean lines, hover = color/opacity shift 150–200ms). → **Язык поверхностей: БЕЗ карточек и без бордеров-коробок.** Разделение — отступ + индент + один тонкий hairline-разделитель между целями. Это прямое исполнение реквеста «самый обычный todo».
- **Цвет — точечно.** Заливок-зон нет. `--duo-green` только на чекбоксах, ховере add-строки и focus-ring. `--duo-red` только на ховере корзины и в ConfirmDialog. Фон страницы — существующий светлый `--paper-soft`.
- **Иерархия — типографикой и индентом, не цветом.** Большая цель: `font-display` (Nunito), 17px/700. Под-цель: 15px/500 с индентом под заголовком. Выполненные: line-through + muted (существующий `.goal-label[data-done]`).
- **Дисклоужер — скромный chevron** слева от строки (lucide `ChevronRight`, поворот на 90° при раскрытии). Убираем прежний огромный «pull»-бар с рукописным SVG.
- **Добавление — классическая строка `+ Add step`** в конце списка под-целей, по клику превращается в инлайн-инпут (Enter/Escape). Убираем `＋` из шапки-цели (в классике add живёт в списке, а не в заголовке).
- **Действия — тихие hover-actions** справа: у цели только корзина, у под-цели только корзина. Появляются на hover/focus-within (pointer:fine), на тач-устройствах видны всегда.

---

## 1. Композиция и ASCII-скетчи

### Общая структура
```
Plan                                    ← h1 font-display 30px (без изменений)
Aim for a level, then break it into steps.   ← subtitle muted

┌ (нет карточки — просто список, hairline между целями) ────────
▸  ◯  Learn 500 kanji                              3/8   [🗑]
────────────────────────────────────────────────────────────── hairline
▾  ◯  Pass JLPT N3                                 1/4   [🗑]
        ◯  Book the exam slot                            [🗑]
        ✓  ~~Buy the textbook~~                          [🗑]
        ◯  Finish grammar deck                           [🗑]
        +  Add step
──────────────────────────────────────────────────────────────
▸  ✓  ~~Reach 10-day streak~~                      2/2   [🗑]
```
`▸`/`▾` = chevron (collapsed/expanded). `◯`/`✓` = чекбокс (зелёный). `[🗑]` = тихая корзина (видна на hover). `3/8` = скромный счётчик прогресса, только если есть шаги.

### Свёрнутая цель — desktop 1440 (ширина списка max 40rem, по центру)
```
[▸] [◯]  Learn 500 kanji ....................... 3/8   [🗑]
 28  44        flex, min-w-0                  count  hover
```
- Строка-цель: `display:flex; gap:8px; padding:8px; border-radius:12px`. Ховер строки → фон `--surface-hover`.
- `[🗑]` opacity 0 → 1 при hover/focus-within строки.

### Развёрнутая цель — desktop 1440
```
[▾] [◯]  Pass JLPT N3 .......................... 1/4   [🗑]
         └ padding-left:34px (индент под заголовок) ┐
         [◯]  Book the exam slot ...................... [🗑]
         [✓]  Buy the textbook (line-through, muted) .. [🗑]
         [◯]  Finish grammar deck ..................... [🗑]
         [+]  Add step            (muted, hover→green)
```

### Инлайн-добавление (после клика на «+ Add step»)
```
         [_______________________________]  [✓] [✕]
          border-bottom, autofocus            add cancel
          Enter = add · Escape = cancel
```

### Мобайл 375 — та же одноколоночная структура, БЕЗ смены лейаута
```
[▸][◯] Learn 500 kanji ......... 3/8 [🗑]     ← title min-w-0, переносится
[▾][◯] Pass JLPT N3 ............ 1/4 [🗑]
       [◯] Book the exam slot ....... [🗑]
       [✓] Buy the textbook ......... [🗑]
       [+] Add step
```
Отличия по ширинам — только гуттеры/воздух, структура идентична (это простой вертикальный список, менять лейаут по брейкпоинтам не нужно — см. reviewer #19/#20: элемент влезает на всех трёх ширинах, ничего не «разваливается»). Ключевая защита: `min-w-0` на заголовке, чтобы длинный текст ужимался/переносился, а не выталкивал счётчик и корзину за край. На тач (hover:none) корзины и счётчик видны постоянно — заложено, что они всегда занимают место, поэтому заголовок и на 375 не прыгает при появлении actions.

- **375:** контентная ширина ~343px. Фиксировано слева-справа: chevron 28 + checkbox 44 + (count ~28 + trash 44) = ~144px, заголовку остаётся ~200px — переносится на 2 строки при необходимости (`word-break`, без `line-clamp`, чтобы не терять текст).
- **768:** тот же список, центрирован, больше воздуха вокруг.
- **1440:** список `max-width:40rem` по центру страницы, hover-actions прячутся до наведения.

---

## 2. Конкретные значения (шкала — брать только отсюда)

| Токен | Значение |
|---|---|
| Ширина списка | `max-width: 40rem` (640px), центр |
| Разделитель целей | `1px solid var(--rule)` (#E5E5E5), только между `.plan-goal` (не вокруг) |
| Строка-цель padding | `8px`; `gap:8px`; `border-radius:12px` |
| Ховер строки-цели | `background: var(--surface-hover)` (#F7F7F7) |
| Chevron | hit 28×28, icon 18px, `--ink-soft`→hover `--ink-muted`; rotate 0°→90° 200ms |
| Чекбокс цели | `GoalCheckbox size="md"` accent `var(--duo-green)` (было red — меняем на green) |
| Чекбокс под-цели | `GoalCheckbox size="sm"` accent `var(--duo-green)` (без изменений) |
| Заголовок цели | `font-display`, 700, `1.0625rem` (17px), lh 1.3, `--ink`, `min-w-0`, `word-break` |
| Счётчик | 700, `0.75rem`, `--ink-soft`, `tabular-nums`; только при `total>0`, формат `done/total` |
| Индент под-списка | `padding-left: 34px` (под заголовок) |
| Строка под-цели padding | `4px 8px`; `gap:8px`; `border-radius:10px`; hover `--surface-hover` |
| Заголовок под-цели | 500, `0.9375rem` (15px), lh 1.35, `--ink`, `min-w-0` |
| «+ Add step» | `margin-left:34px`; 600, `0.875rem`, `--ink-soft`→hover `--duo-green` |
| Инпут добавления | `border-bottom:2px solid var(--rule)`→focus `--duo-green`; `0.9375rem` |
| Корзина / confirm / cancel | переиспользуем `.goal-icon-btn` (+`--sm`, `--danger`/`--confirm`) — без нового примитива |
| Анимации | expand/collapse 220ms, delete 180–220ms, chevron 200ms, hover 150ms; всё `ease-out`/`transform`/`opacity` |

Никаких магических значений вне этой таблицы (reviewer #15). Цвета — только из существующих токенов `:root` (reviewer #11/#21).

---

## 3. Карта слоёв (z-index) и fixed-зон

- Контент списка — поток документа, `z` не задаём.
- **ConfirmDialog** (существующий) — единственный оверлей, full-screen fixed по центру, свой скрим. Живёт вне `overflow`-контейнеров списка (reviewer #4/#8). Тостов/новых fixed-зон вид не вводит. Конфликтов зон нет.
- Прежний `.goal-pull` fixed-affordance удаляется — его место занимает inline-chevron в потоке.

---

## 4. Инвентаризация состояний (reviewer #10)

**Страница:** loading (`LoadingSpinner`) · error (`ErrorMessage` + retry) · empty (нет целей) · default (список).
**Строка-цель:** default · hover (фон + actions) · focus-within (actions видны) · collapsed/expanded · completed (line-through+muted) · deleting (fade+height-collapse).
**Строка под-цели:** default · hover · focus-within · completed · deleting (classic fade+collapse, БЕЗ частиц).
**Чекбокс:** unchecked · checked (`.pop` scale) · focus-visible (ring) · disabled (не используется здесь).
**Add-affordance:** idle («+ Add step») · active (инпут, autofocus) · empty-input (кнопка ✓ disabled) · submit (Enter) · cancel (Escape/✕).
**Иконочные кнопки:** default (ghost) · hover (tinted circle) · active (scale .9) · focus-visible (ring) · disabled (opacity .4).

---

## 5. Микро-интеракции (reviewer #6/#18, контракт фидбека ≤200ms)

- **Toggle чекбокса** → мгновенно `.pop` (scale) + line-through через `--duo-green` заливку. Оптимистично (react-query).
- **Chevron** → плавный поворот 90° 200ms + раскрытие тела (`grid-template-rows 0fr→1fr` 220ms). `aria-expanded` синхронно.
- **Hover строки** → фон `--surface-hover` 150ms; actions fade-in 150ms. На тач видны сразу.
- **Add step** → клик открывает инпут с autofocus; Enter создаёт (строка появляется сразу — видимая реакция), Escape/✕ закрывает.
- **Удаление под-цели** → быстрый fade (180ms) + схлопывание высоты (200ms), затем мутация. Частицы/вспышка удалены.
- **Удаление цели** → fade + height-collapse обёртки (220ms), затем мутация.
- Всё в границах `prefers-reduced-motion` — существующий media-блок расширяем на новые классы (см. §7).

---

## 6. Скелеты разметки

### `page.tsx` — шапка и пустое состояние (классический тон)
```tsx
// шапка без изменений по сути:
<div>
  <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--ink)' }}>Plan</h1>
  <p className="mt-1 text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
    Aim for a level, then break it into steps.
  </p>
</div>

// список: было <div className="mx-auto max-w-2xl space-y-4">…map PlanGoalCard…</div>
// стало — семантический ul с classes вида:
<ul className="plan-list">
  {data.goals.map((g) => <PlanGoalCard key={g.id} goal={g} />)}
</ul>

// empty state — приглушённый (нейтральный кружок, без цветной заливки-зоны):
<div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--paper-soft)', color: 'var(--ink-soft)' }}>
    <Target className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
  </span>
  <h2 className="font-display text-xl font-extrabold" style={{ color: 'var(--ink)' }}>No goals yet</h2>
  <p className="text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
    Go to Skills and tap the target on any skill to aim for your next level.
  </p>
  <Link href="/skills" className="button-ghost">Go to Skills</Link>
</div>
```

### `PlanGoalCard.tsx` — рендерит строку-цель + тело
```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useDeleteBigGoal, useToggleBigGoal } from '@/hooks/use-plan';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GoalCheckbox from './GoalCheckbox';
import GoalLabel from './GoalLabel';
import MediumGoalRow from './MediumGoalRow';
import AddMediumInput from './AddMediumInput';
import type { PlanBigGoal } from '@/types';

const DELETE_MS = 220;

export default function PlanGoalCard({ goal }: { goal: PlanBigGoal }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleBig = useToggleBigGoal();
  const deleteBig = useDeleteBigGoal();

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    setDeleting(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = setTimeout(() => deleteBig.mutate(goal.id), reduce ? 0 : DELETE_MS);
  };

  const total = goal.mediumGoals.length;
  const done = goal.mediumGoals.filter((m) => m.completed).length;

  return (
    <li className="plan-goal" data-done={goal.completed || undefined} data-deleting={deleting || undefined}>
      <div className="plan-goal-collapse" data-open={!deleting}>
        <div className="plan-goal-collapse-inner">

          {/* PARENT ROW */}
          <div className="plan-goal-head">
            <button
              type="button"
              className="plan-disclosure"
              aria-expanded={open}
              aria-label={open ? 'Collapse steps' : 'Expand steps'}
              onClick={() => setOpen((v) => !v)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <GoalCheckbox
              checked={goal.completed}
              onToggle={() => toggleBig.mutate({ id: goal.id, completed: !goal.completed })}
              accent="var(--duo-green)"
            />
            <GoalLabel text={goal.title} completed={goal.completed} className="plan-goal-title font-display" />
            {total > 0 && <span className="plan-goal-count">{done}/{total}</span>}
            <div className="plan-goal-actions">
              <button type="button" className="goal-icon-btn goal-icon-btn--danger"
                      aria-label="Delete goal" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="plan-goal-body" data-open={open}>
            <div className="plan-goal-body-inner">
              <ul className="plan-substeps">
                {goal.mediumGoals.map((m) => (
                  <MediumGoalRow key={m.id} bigGoalId={goal.id} medium={m} />
                ))}
              </ul>
              {adding ? (
                <AddMediumInput bigGoalId={goal.id} onDone={() => setAdding(false)} />
              ) : (
                <button type="button" className="plan-add-step" onClick={() => setAdding(true)}>
                  <Plus aria-hidden="true" /> Add step
                </button>
              )}
            </div>
          </div>

          {confirmDelete && (
            <ConfirmDialog
              title="Delete goal?"
              message="Do you really want to delete this goal?"
              confirmLabel="Yes" cancelLabel="No"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={handleConfirmDelete}
            />
          )}
        </div>
      </div>
    </li>
  );
}
```
> Импорт `Plus` из `lucide-react` добавить в шапку. `ChevronArc` компонент и его SVG удалить целиком. `open` больше не форсится при add — add-строка живёт в уже раскрытом теле (клик на chevron раскрывает).

### `MediumGoalRow.tsx` — плоская под-строка, classic delete
```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDeleteMediumGoal, useToggleMediumGoal } from '@/hooks/use-plan';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GoalCheckbox from './GoalCheckbox';
import GoalLabel from './GoalLabel';
import type { PlanMediumGoal } from '@/types';

const DELETE_MS = 200;

export default function MediumGoalRow({ medium }: { bigGoalId: string; medium: PlanMediumGoal }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'deleting'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleMed = useToggleMediumGoal();
  const deleteMed = useDeleteMediumGoal();

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    setPhase('deleting');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = setTimeout(() => deleteMed.mutate(medium.id), reduce ? 0 : DELETE_MS);
  };

  return (
    <li className="plan-substep" data-phase={phase}>
      <div className="plan-substep-row">
        <GoalCheckbox
          checked={medium.completed}
          onToggle={() => toggleMed.mutate({ id: medium.id, completed: !medium.completed })}
          accent="var(--duo-green)"
          size="sm"
        />
        <GoalLabel text={medium.title} completed={medium.completed} className="plan-substep-title" />
        <button type="button" className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--danger"
                aria-label="Delete step" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-[15px] w-[15px]" aria-hidden="true" />
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete step?"
          message="Do you really want to delete this step?"
          confirmLabel="Yes" cancelLabel="No"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </li>
  );
}
```
> Удалить весь particle/flash-блок (`Check`, `PARTICLE_COUNT`, `TOTAL_MS`, `showDeleteEffects`, `<span className="goal-step-particles">`, `<span className="goal-step-flash">`). Импорт `Check` убрать.

### `AddMediumInput.tsx` — инлайн-инпут (классический underline-стиль)
```tsx
// логика без изменений (value, submit, Enter/Escape, autofocus).
// меняются только классы обёртки/инпута и порядок:
return (
  <div className="plan-add-input">
    <input
      ref={inputRef} type="text" className="plan-input" placeholder="New step…"
      value={value} onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone(); }}
    />
    <div className="plan-add-input-actions">
      <button type="button" className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--confirm"
              aria-label="Create step" disabled={!value.trim()} onClick={submit}>
        <Check className="h-[15px] w-[15px]" aria-hidden="true" />
      </button>
      <button type="button" className="goal-icon-btn goal-icon-btn--sm"
              aria-label="Cancel" onClick={onDone}>
        <X className="h-[15px] w-[15px]" aria-hidden="true" />
      </button>
    </div>
  </div>
);
```

### `GoalCheckbox.tsx` / `GoalLabel.tsx`
Без изменений (переиспользуем как есть). `GoalLabel[data-done]` уже даёт line-through + muted — это и есть классический «выполнено».

---

## 7. Полный replacement CSS секции Plan

Заменить блок `globals.css` строки **610–792** (от `/* ═══ Plan · goal card (redesign) ... */` до конца keyframes `goal-step-flash-kf`) на:

```css
/* ════════════════════════════════════════════════════════════
   Plan · classic todo list — flat, borderless, indented substeps
   Accent (green) only on checkboxes + add affordance; red only on delete.
   ════════════════════════════════════════════════════════════ */

/* list */
.plan-list { max-width: 40rem; margin: 0 auto; }
.plan-goal { list-style: none; }
.plan-goal + .plan-goal { border-top: 1px solid var(--rule); }

/* delete height-collapse wrapper */
.plan-goal-collapse { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 220ms ease; }
.plan-goal-collapse[data-open="false"] { grid-template-rows: 0fr; }
.plan-goal-collapse-inner { overflow: hidden; min-height: 0; }
.plan-goal[data-deleting] .plan-goal-collapse-inner { animation: plan-fade-out 220ms ease forwards; }

/* PARENT ROW */
.plan-goal-head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px; border-radius: 12px;
  transition: background-color 150ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .plan-goal-head:hover { background: var(--surface-hover); }
}

/* disclosure chevron */
.plan-disclosure {
  flex: 0 0 auto; width: 28px; height: 28px; display: grid; place-items: center;
  border: none; background: transparent; color: var(--ink-soft); cursor: pointer;
  border-radius: 8px; transition: color 150ms ease, background-color 150ms ease;
}
.plan-disclosure svg { width: 18px; height: 18px; transition: transform 200ms var(--ease-out-strong); }
.plan-disclosure[aria-expanded="true"] svg { transform: rotate(90deg); }
@media (hover: hover) and (pointer: fine) {
  .plan-disclosure:hover { color: var(--ink-muted); background: var(--surface-hover); }
}
.plan-disclosure:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; }

/* title */
.plan-goal-title {
  flex: 1 1 auto; min-width: 0;
  font-weight: 700; font-size: 1.0625rem; line-height: 1.3; color: var(--ink);
  word-break: break-word;
}

/* progress count */
.plan-goal-count {
  flex: 0 0 auto; font-weight: 700; font-size: 0.75rem; color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

/* parent hover-actions */
.plan-goal-actions { flex: 0 0 auto; display: flex; gap: 2px; }

/* unified green tint on unchecked checkboxes */
.plan-goal-head .goal-checkbox::before,
.plan-substep-row .goal-checkbox::before { border-color: color-mix(in srgb, var(--duo-green) 34%, #fff); }

/* BODY (collapsible) */
.plan-goal-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 220ms ease-out; }
.plan-goal-body[data-open="true"] { grid-template-rows: 1fr; }
.plan-goal-body-inner { overflow: hidden; min-height: 0; }
.plan-goal-body[data-open="true"] .plan-goal-body-inner { padding: 2px 0 8px; }

/* substeps — indented under parent title */
.plan-substeps { display: flex; flex-direction: column; padding-left: 34px; }
.plan-substep { list-style: none; display: grid; grid-template-rows: 1fr; overflow: hidden; }
.plan-substep-row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 8px; border-radius: 10px; transition: background-color 150ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .plan-substep-row:hover { background: var(--surface-hover); }
}
.plan-substep-title { flex: 1 1 auto; min-width: 0; font-weight: 500; font-size: 0.9375rem; line-height: 1.35; color: var(--ink); word-break: break-word; }
.plan-substep[data-phase="deleting"] { animation: plan-substep-collapse 200ms ease forwards; }
.plan-substep[data-phase="deleting"] .plan-substep-row { animation: plan-fade-out 180ms ease forwards; }

/* reveal-on-hover for quiet actions (pointer:fine only; always visible on touch) */
@media (hover: hover) and (pointer: fine) {
  .plan-goal-actions .goal-icon-btn,
  .plan-substep-row .goal-icon-btn--danger { opacity: 0; transition: opacity 150ms ease; }
  .plan-goal-head:hover .plan-goal-actions .goal-icon-btn,
  .plan-goal-head:focus-within .plan-goal-actions .goal-icon-btn,
  .plan-substep-row:hover .goal-icon-btn--danger,
  .plan-substep-row:focus-within .goal-icon-btn--danger { opacity: 1; }
}

/* "+ Add step" affordance */
.plan-add-step {
  display: flex; align-items: center; gap: 8px;
  margin-left: 34px; padding: 6px 8px; border-radius: 10px;
  border: none; background: transparent; cursor: pointer;
  font: inherit; font-weight: 600; font-size: 0.875rem; color: var(--ink-soft);
  transition: color 150ms ease, background-color 150ms ease;
}
.plan-add-step svg { width: 16px; height: 16px; }
@media (hover: hover) and (pointer: fine) {
  .plan-add-step:hover { color: var(--duo-green); background: var(--surface-hover); }
}
.plan-add-step:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; }

/* inline add-input row */
.plan-add-input { margin-left: 34px; padding: 4px 8px; display: flex; align-items: center; gap: 6px; }
.plan-input {
  flex: 1 1 auto; min-width: 0;
  border: none; border-bottom: 2px solid var(--rule); border-radius: 0;
  padding: 4px 2px; font: inherit; font-size: 0.9375rem; color: var(--ink); background: transparent;
}
.plan-input:focus { border-bottom-color: var(--duo-green); outline: none; }
.plan-input::placeholder { color: var(--ink-soft); }
.plan-add-input-actions { flex: 0 0 auto; display: flex; gap: 2px; }

@keyframes plan-fade-out { to { opacity: 0; } }
@keyframes plan-substep-collapse { 0% { grid-template-rows: 1fr; } 100% { grid-template-rows: 0fr; } }

/* keep reusing: .goal-checkbox, .goal-icon-btn(+--sm,--danger,--confirm), .goal-label — unchanged */
```

**Также** обнови reduced-motion блок (строки ~417–420): замени ссылки на удалённый `.goal-pull` на новые классы:
```css
  .goal-icon-btn:active:not(:disabled),
  .goal-icon-btn:hover:not(:disabled),
  .plan-disclosure:hover,
  .plan-add-step:hover { transform: none; }
```
(reduced-motion уже глушит все `transition`/`animation` глобально в блоке 408–413 — chevron-поворот и fade станут мгновенными, менять их отдельно не нужно.)

Классы `.goal-checkbox`, `.goal-icon-btn` и их модификаторы, `.goal-label`, keyframes `pop` — НЕ трогать (переиспользуются). Все прочие `.goal-card*`, `.goal-head*`, `.goal-body*`, `.goal-progress*`, `.goal-steps*`, `.goal-step*`, `.goal-pull*`, `.goal-chevron*`, `.goal-empty`, `.goal-input`, `.goal-step-add*` и их keyframes (`goal-card-fade-out`, `goal-step-shrink`, `goal-step-collapse`, `goal-step-particle`, `goal-step-flash-kf`) — удалить (заменены выше).

> **Tailwind v4 (reviewer #22):** новые `.plan-*` — unlayered, как и прежние `.goal-*`. Мы НЕ переопределяем их Tailwind-утилитами из JSX, поэтому каскад-конфликта нет. Всё оформление вида держим в `.plan-*`, а не в утилитах.

---

## 8. Прогон плана через `frontend-ui-design-reviewer`

План проверен frontend-ui-design-reviewer; добавленные/подтверждённые пункты:
1. **#1 grid fixed children** — н/д: строки на `flex`, не `grid`. Явно зафиксировано.
2. **#2 flex-1 + min-w-0** — `min-w-0` на `.plan-goal-title` и `.plan-substep-title` (иначе длинный заголовок вытолкнет счётчик/корзину). ✅ в CSS.
3. **#3 контент под fixed** — н/д: страница скроллится, фиксированной шапки нет; ConfirmDialog центрирован full-screen.
4. **#4 конфликт fixed-зон** — карта слоёв §3: единственный оверлей ConfirmDialog, тостов нет.
5. **#5 голые нативные контролы** — `<input>` стилизован `.plan-input`; чекбоксы — кастомный `.goal-checkbox` (не нативный). ✅
6. **#6 молчаливые действия** — критерий: toggle→`.pop`+line-through, add→строка сразу, delete→fade+collapse (§5).
7. **#7 confirm()/alert()** — не используются; удаление через `ConfirmDialog` (mandate: оставить). ✅
8. **#8 обрезанные поповеры** — ConfirmDialog вне `overflow`; список `overflow:hidden` только на collapse-обёртках, поповеров внутри нет.
9. **#9 проверка на реальном контенте** — критерий приёмки: длинные заголовки (2+ строки), много под-целей, юникод (кандзи).
10. **#10 состояния** — полная инвентаризация §4.
11. **#11 AI-slop** — нет градиентов, нет карточек-в-карточках (карточки убраны), Nunito (бренд), зелёный акцент точечно. ✅
12. **#13 a11y** — `button` везде (не div), `aria-label` на иконках, `aria-expanded` на chevron, focus-visible ring, контраст `--ink`(#4B4B4B)/`--ink-soft`(#AFAFAF muted-текст ≥ порога для крупного) на белом, prefers-reduced-motion учтён.
13. **#15 магические значения** — вся шкала в §2; инлайн-hex нет.
14. **#16 z-index** — §3, без анархии.
15. **#17/#19/#20 адаптив** — §1: одинаковый одноколоночный лейаут на 375/768/1440, менять лейаут по брейкпоинтам не требуется; стресс длинным текстом покрыт `min-w-0`+`word-break`; переносов-«разваливаний» нет (нет `flex-wrap` на строках).
16. **#21 бордеры** — осознанный стиль Flat/минимал: строки без бордеров, разделение отступом+индентом+одним hairline-разделителем между целями (divider — не box-border).
17. **#22 Tailwind v4 @layer** — примечание в §7: не переопределяем `.plan-*` утилитами.

Непокрытых классов не осталось; специфичных к плану правок дописано: min-w-0 на обоих заголовках, reveal-on-hover только для pointer:fine (тач — видимы), hairline-divider вместо бордеров-коробок.

---

## 9. Кусок исполнения (один, Sonnet)

**Задача:** переключить `/plan` на классический todo-лейаут строго по этому плану.

**Файлы (все — фронтенд, один связный кусок, не пересекается ни с чем ещё):**
1. `src/app/globals.css` — заменить блок «Plan» (строки 610–792) на CSS из §7; обновить reduced-motion блок (§7); удалить перечисленные старые `.goal-card*`/`.goal-step*`/`.goal-pull*`/`.goal-chevron*` классы и их keyframes.
2. `src/components/plan/PlanGoalCard.tsx` — по скелету §6 (удалить `ChevronArc`, `Plus` в шапке-действиях → перенос в add-строку, импорт `Plus`, `data-deleting`, новая разметка).
3. `src/components/plan/MediumGoalRow.tsx` — по скелету §6 (удалить particle/flash, `Check`/`PARTICLE_COUNT`/`TOTAL_MS`/`showDeleteEffects`; `DELETE_MS=200`; новые классы).
4. `src/components/plan/AddMediumInput.tsx` — новые классы обёртки/инпута (§6), логика без изменений.
5. `src/app/(protected)/plan/page.tsx` — `<ul className="plan-list">` вместо `<div className="mx-auto max-w-2xl space-y-4">`; нейтральный empty-state (§6).
6. `GoalCheckbox.tsx`, `GoalLabel.tsx`, `ConfirmDialog.tsx` — НЕ трогать.

**Не менять:** `use-plan.ts`, `lib/queries/plan.ts`, `lib/plan.ts`, любые `api/plan/**`.

**Критерии готовности:**
- Заголовок цели — `font-display` 17/700; под-цели 15/500; выполненные — line-through+muted.
- Chevron слева раскрывает/сворачивает тело с плавной высотой; `aria-expanded` корректен.
- Под-цели индентированы под заголовком; add-строка «+ Add step» → инпут (Enter/Escape).
- Корзины тихие: скрыты до hover/focus на pointer:fine, видны на тач; длинный заголовок их НЕ выталкивает (`min-w-0`).
- Никаких цветных заливок-зон, карточек и бордеров-коробок; между целями — тонкий hairline.
- Удаление под-цели — fade+collapse (без частиц); удаление цели — fade+collapse; оба через ConfirmDialog.
- Проверено с длинными заголовками, множеством под-целей и юникодом на 375 и 1440.

**Гейт (build запрещён — жив dev-сервер):**
```
npx tsc --noEmit
pnpm lint
```
Оба зелёные по затронутым файлам. Плюс визуальная самопроверка в уже запущенном dev-сервере (без перезапуска).
