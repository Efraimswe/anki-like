# План — инлайн-редактирование названий целей на /plan

Вид: Production (frontend+backend). Один кусок исполнения (Sonnet). Контракт-аддитивно: существующий toggle-путь не трогаем, только расширяем.

## Решения (зафиксированы, не пересматривать в исполнении)
1. **Схема БД не меняется.** `plan_goals.title` и `plan_medium_goals.title` уже `VarChar(200)` → лимит title = `max(200)`, совпадает с `createMediumGoalSchema`. Миграции нет.
2. **Zod: отдельная схема, не union.** Добавить `updateGoalTitleSchema = z.object({ title: z.string().trim().min(1).max(200) })`. `toggleGoalSchema` оставить как есть.
3. **PATCH ветвится по наличию `title` в теле.** Есть `title` → путь title; иначе → старый путь `completed`. Владение сохранено (big: `updateMany where {id,userId}`; medium: `findFirst … bigGoal.userId`).
4. **Инпут, не textarea.** Enter=save однозначно; горизонтальный скролл длинного title приемлем и совпадает с поведением AddMediumInput. Курсор в конец — `setSelectionRange(len,len)` в эффекте после focus.
5. **Один общий компонент** `EditableGoalTitle` (display-кнопка ↔ inline-редактор в ОДНОЙ строке, как AddMediumInput). Используют и PlanGoalCard, и MediumGoalRow — без дублирования логики.
6. **Триггер edit — только клик по тексту** (отдельная `<button>`, сиблинг чекбокса/корзины, не обёртка). Поэтому клик по чекбоксу/корзине физически не может включить edit — `stopPropagation` не нужен.
7. **Пустой/неизменённый → отмена (без сети).** `t = value.trim(); if (!t || t === original) → onCancel()`, иначе `onSave(t)`. Save оптимистичен, тост только на ошибку (мгновенный визуальный отклик = нет молчаливого действия).

## Кусок 1 (единственный) — файлы и критерии

### 1. `src/lib/validations.ts`
Добавить рядом с `toggleGoalSchema`:
```ts
export const updateGoalTitleSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
```

### 2. `src/app/api/plan/goals/[id]/route.ts` (PATCH)
Импортировать `updateGoalTitleSchema`. После `const body = await request.json().catch(() => null);` — до текущего `toggleGoalSchema.safeParse`:
```ts
if (body && typeof body === 'object' && 'title' in body) {
  const parsed = updateGoalTitleSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { title } = parsed.data;
  const res = await prisma.planGoal.updateMany({ where: { id, userId: user.sub }, data: { title } });
  if (res.count === 0) return jsonError(404, 'Goal not found');
  return NextResponse.json({ id, title });
}
```
Ниже — существующий `completed`-путь без изменений.

### 3. `src/app/api/plan/medium/[id]/route.ts` (PATCH)
Тот же ветвящийся блок, но по паттерну medium: сначала `findFirst({ where: { id, bigGoal: { userId: user.sub } }, select: { id: true } })` → 404 если нет; затем `prisma.planMediumGoal.update({ where: { id }, data: { title } })`; вернуть `{ id, title }`. Существующий `completed`-путь не трогать.

**Контракты PATCH (оба роута):**
- Тело `{ "title": "..." }` → 200 `{ id, title }` (title после trim).
- Тело `{ "completed": bool }` → 200 `{ id, completed }` (как раньше).
- Пустой/только пробелы title, title > 200, невалидный тип → **400** `{ error: <message> }`.
- Чужой/несуществующий id → **404** `{ error: 'Goal not found' }`.
- Нет авторизации → 401 (через `requireAuth`).

### 4. `src/hooks/use-plan.ts`
Добавить immutable-хелперы (рядом с `setBigGoalCompleted`/`setMediumGoalCompleted`):
```ts
function setBigGoalTitle(data, id, title) { /* map goals: g.id===id ? {...g, title} : g */ }
function setMediumGoalTitle(data, id, title) { /* map goals→mediumGoals: m.id===id ? {...m, title} : m */ }
```
Добавить два хука по шаблону `useToggleBigGoal`/`useToggleMediumGoal` (onMutate cancel→snapshot→setQueryData; onError rollback + `toast({ type:'error', title:'Couldn’t save — try again' })`; onSettled invalidate). Тип input `{ id: string; title: string }`, ответ `{ id: string; title: string }`:
- `useUpdateBigGoalTitle` → `PATCH /api/plan/goals/${id}` body `{ title }`, оптимистично `setBigGoalTitle`.
- `useUpdateMediumGoalTitle` → `PATCH /api/plan/medium/${id}` body `{ title }`, оптимистично `setMediumGoalTitle`.
Успешного тоста НЕ добавлять (оптимистика уже отражает результат).

### 5. `src/components/plan/EditableGoalTitle.tsx` (новый, `'use client'`)
Props: `{ value: string; completed: boolean; onSave: (title: string) => void; className?: string; ariaLabel: string; iconSize?: 'sm' }` (iconSize управляет `goal-icon-btn--sm` — для substep). Внутреннее состояние `editing` + `draft`.
- **Display**: `<button type="button" className="goal-title-trigger" onClick={() => { setDraft(value); setEditing(true); }} aria-label={`Rename: ${value}`}>` → внутри `<GoalLabel text={value} completed={completed} className={className} />` (GoalLabel НЕ менять — line-through переиспользуется).
- **Edit**: `<div className="plan-edit-title">` содержит `<input className="plan-input">` + `<div className="plan-add-input-actions">` c кнопкой Check (`goal-icon-btn goal-icon-btn--confirm` [+`--sm`], `disabled={!draft.trim()}`, aria-label "Save") и кнопкой X (`goal-icon-btn` [+`--sm`], aria-label "Cancel"). Иконки `lucide-react` Check/X, размеры как в AddMediumInput (`h-[15px] w-[15px]`).
- Логика: `submit()` = `const t = draft.trim(); if (t && t !== value) onSave(t); setEditing(false);` (пустой/без изменений → просто выход, без onSave). `cancel()` = `setEditing(false)`.
- `onKeyDown`: Enter→submit, Escape→cancel.
- **Focus-менеджмент**: `inputRef` в effect при входе в edit: `focus()` + `setSelectionRange(len, len)`. При выходе — вернуть фокус на trigger-кнопку (`triggerRef`), чтобы не терялся фокус (клавиатурный сценарий). Реализовать через effect по `editing`.

### 6. `src/components/plan/PlanGoalCard.tsx`
- Импорт `useUpdateBigGoalTitle`, `EditableGoalTitle`. Локальный `const [editingTitle, setEditingTitle] = useState(false)` для скрытия meta-строки.
- Заменить `<GoalLabel text={goal.title} … className="plan-goal-title font-display" />` на:
  `<EditableGoalTitle value={goal.title} completed={goal.completed} className="plan-goal-title font-display" ariaLabel="Rename goal" onSave={(title) => updateTitle.mutate({ id: goal.id, title })} onEditingChange={setEditingTitle} />`
  (добавить в компонент опциональный `onEditingChange?: (v:boolean)=>void`, дёргать при входе/выходе).
- Пока `editingTitle` — не рендерить `.plan-goal-head-meta` (count+trash), чтобы убрать шум и исключить случайное удаление во время правки. Чекбокс и disclosure остаются.
- GoalLabel-импорт остаётся (используется внутри EditableGoalTitle, но здесь можно убрать если больше не используется напрямую — убрать только если orphan).

### 7. `src/components/plan/MediumGoalRow.tsx`
- Аналогично: `useUpdateMediumGoalTitle`, `EditableGoalTitle` с `iconSize="sm"`, `className="plan-substep-title"`, `ariaLabel="Rename step"`, `onSave={(title) => updateTitle.mutate({ id: medium.id, title })}`.
- Пока editing — скрыть `.plan-substep-row-meta` (trash).

### 8. `src/app/globals.css` (минимальные добавления рядом с `.plan-add-input`)
```css
.goal-title-trigger {
  flex: 1 1 auto; min-width: 0; display: block; text-align: left;
  border: none; background: transparent; padding: 0; margin: 0;
  font: inherit; color: inherit; cursor: text;
}
.goal-title-trigger:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; border-radius: 6px; }
.plan-edit-title { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px; }
```
Переиспользуются как есть: `.plan-input`, `.plan-add-input-actions`, `.goal-icon-btn(--sm/--confirm)`. НЕ использовать `.plan-add-input` (у неё `margin-left:34px` — для body-контекста, не для inline-строки заголовка).

### 9. Тест `tests/unit/plan-validation.test.ts` (новый)
`describe('updateGoalTitleSchema')`: валидный title → success; `'   '`/`''` → fail; строка длиной 201 → fail; `{ title: '  hi  ' }` → success и `data.title === 'hi'` (trim). (Роут-интеграционных тестов в проекте нет — остаёмся на unit-уровне схемы, консистентно с существующими тестами.)

## Проверка UI (frontend-ui-design-reviewer + a11y) — заложено в план
- **Молчаливые действия**: save оптимистичен (отклик <200ms), ошибка → тост-rollback. Нет немого действия.
- **Хит-зоны**: save/cancel — `goal-icon-btn(--sm)` = 40–44px, как в AddMediumInput. Trigger-кнопка наследует высоту строки title (line-height 1.3, ≥ ~22px) плюс padding строки-контейнера.
- **Лейаут 375**: input `flex:1 1 auto; min-width:0` — сжимается; в head-top конкурируют disclosure(28)+checkbox(44)+2×кнопки(40) ≈ 152px фикс + гэпы, input получает остаток и не выталкивает строку (min-width:0 гарантирует отсутствие горизонтального скролла страницы). meta-строка на время edit скрыта → на одной строке максимум 5 контролов, но input сжимаем.
- **a11y**: display — нативная `<button>` (Enter/Space активируют edit, screen-reader-friendly aria-label). Автофокус инпута + курсор в конец при входе; возврат фокуса на trigger при выходе. Enter/Escape обработаны.
- **Security**: владение проверяется на сервере (userId в updateMany/findFirst) — клиент не может править чужие цели; title валидируется zod на границе (trim, 1..200) до записи; 400 на пустой/длинный.

## Гейт (build запрещён — жив dev)
`npx tsc --noEmit` && `pnpm lint` && `pnpm test` — всё зелёное по затронутой зоне.

## Границы (НЕ делать)
Не трогать: дедуп-индекс skill+level, автогенерацию `buildBigGoalTitle`, схему БД/миграции, toggle/delete-пути, визуал чекбокса, `toggleGoalSchema`. Редактирование title автоген-целей — просто перезапись в кастомный текст, это ок.
