# План: фича «Plan» (цели, привязанные к скиллам) — Lexa

Вид: Production (frontend + backend). Фаза A — планирование. Стек проекта: Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4 (без config, `@import 'tailwindcss'`), TanStack Query v5, Prisma 6 (Postgres/Neon), Zod, Clerk, lucide-react, gsap, pnpm. Стили — существующие CSS-переменные/классы из `globals.css`. Новых npm-зависимостей НЕ добавляем. Опирается на уже реализованную фичу «Skills» (`plan-skills.md`): `SkillProgress`, `SKILLS`/`SKILL_CODES`, `/skills`.

---

## 1. Цель

Пользователь ставит себе «большие цели», привязанные к конкретному уровню конкретного скилла, и дробит их на «средние цели» (подзадачи). Точка входа — кнопка-прицел «Aim» на карточке скилла (`/skills`): один клик создаёт большую цель `Complete lvl {N} of {Skill}`, где N — следующий непройденный уровень. Все цели живут в новой секции `/plan` (пункт навигации между Learn и Skills). Большую цель можно развернуть, добавлять/удалять средние цели, отмечать выполненными (фирменная деталь — «рукописное» зачёркивание SVG-каракулей), удалять с подтверждением и покадровой анимацией распада. Цели и прогресс скиллов НЕ связаны логикой: выполнение цели — ручное (чекбокс), оно не двигает `SkillProgress` и наоборот.

## 2. Критерии готовности (Definition of Done)

1. В навигации три пункта: `Learn | Plan | Skills` (топбар ≥1024px и нижний таббар <1024px). `/plan` активен на своих маршрутах.
2. На `/skills` у каждой карточки скилла есть круглая кнопка «Aim» (иконка прицела). Клик по ней **не** ведёт на страницу скилла. Скилл 10/10 → кнопка disabled.
3. Клик «Aim» создаёт большую цель `Complete lvl {N} of {SkillName}` (N = `completedLevel + 1`, вычисляется на сервере). Успех → тост `Added to your plan`. Если активная большая цель на этот же скилл+уровень уже есть → второй не создаётся, тост `Already in your plan`.
4. `/plan` показывает список карточек больших целей (новейшая сверху). Пустой список → осмысленное empty-состояние со ссылкой-подсказкой на Skills.
5. Большая цель: круглый чекбокс + заголовок; плавное (grid-rows) разворачивание/сворачивание. В развёрнутом виде — список средних целей и футер-ряд `[мусорка] [шеврон] [+]`.
6. «+» → в конце списка появляется инлайн-инпут (автофокус) с мини-кнопками крестик/галочка; Enter = создать, Escape = отмена; пустой текст не создаётся.
7. Чекбоксы большой и средней цели тогглятся оптимистично (реакция ≤200мс). Выполненная цель зачёркнута «рукописной» SVG-каракулей с draw-on анимацией.
8. Удаление любой цели → модалка `Do you really want to delete this goal?` с `No` (ghost) / `Yes` (красная). Средняя цель удаляется покадровой анимацией (сжатие → облачко частиц → вспышка-галочка → схлопывание места); большая — fade/collapse. `prefers-reduced-motion` → мгновенно, без частиц.
9. Безопасность: `userId` только из сессии Clerk (никогда из тела); zod-валидация тела на границе; каждый эндпоинт трогает только цели владельца — чужую цель PATCH/DELETE не может (→ 404).
10. Состояния loading / error / empty обработаны (`LoadingSpinner`, `ErrorMessage`). Аккуратно на 375 / 768 / 1440, без горизонтального скролла, контент не под нижним таббаром, интерактив ≥44px.
11. Гейт фичи зелёный: `pnpm prisma:migrate` + `pnpm build` + `pnpm lint` + `pnpm test` + смоук (§10).

## 3. Ключевые решения (зафиксировано — исполнители не меняют молча)

- **Две таблицы:** `plan_goals` (большие цели) и `plan_medium_goals` (средние, FK на большую, `ON DELETE CASCADE`). Большая FK на `users` cascade. Средняя НЕ хранит `userId` (нормализовано) — её владелец проверяется через связь `bigGoal.userId`.
- **Большая цель всегда рождается только из кнопки Aim** → у неё всегда есть `skill` + `level`. Ручного создания большой цели на `/plan` нет (там только «+» для средних). Поэтому `skill`/`level`/`title` — NOT NULL.
- **`level` и `title` вычисляет сервер, не клиент.** Тело POST несёт только `{ skill }`. Сервер читает `SkillProgress`, берёт `level = completedLevel + 1`, строит `title = Complete lvl {level} of {SkillName}`. Клиент не может подделать уровень/текст. `completedLevel >= 10` → 409 (страховка к disabled-кнопке).
- **Дедуп активных больших целей — на уровне БД, атомарно.** Частичный уникальный индекс `(user_id, skill, level) WHERE completed = false`. Повторный Aim (в т.ч. двойной клик/гонка) ловится как unique-violation (P2002) → сервер возвращает существующую активную цель с флагом `duplicate: true` (HTTP 200, не ошибка). Завершённые цели индекс не блокирует — после выполнения можно нацелиться на тот же уровень снова.
- **Оба ответа POST-Aim — HTTP 200** (`{ goal, duplicate }`), чтобы фронт различал успех/дубликат по флагу, а не по коду ошибки. Реальные ошибки (401/400/409-mastered) остаются ошибками.
- **Тоггл цели — идемпотентный `completed: boolean`** (не «инкремент»), поэтому двойной клик безопасен без спец-механики. Оптимистичный апдейт кэша + скрайбл дают фидбек ≤200мс. Тосты на тоггл НЕ показываем (скрайбл + чекбокс — достаточный видимый фидбек; тосты только на ошибках) — меньше шума.
- **Плавная высота — CSS grid-rows trick** (`grid-template-rows: 0fr → 1fr`, `overflow:hidden; min-height:0` у внутреннего), без JS-измерений высоты. Тот же приём для схлопывания места удалённой средней цели.
- **Частицы/вспышка/каракуля — CSS-only** (transform/opacity + keyframes), по образцу существующих `skill-burst-*` и `level-celebration-confetti` в `globals.css`. Никакого JS-анимационного рантайма.
- **Модалку переиспользуем** — существующий `ConfirmDialog` (портал/Escape/клик по фону, `btn-red` подтверждение). Расширяем его аддитивно опциональным пропом `cancelLabel` (дефолт `Cancel`, обратная совместимость с текущими вызовами) — чтобы показать `No`/`Yes`.
- **Кнопка Aim не вложена в `<a>`.** Сейчас вся карточка скилла обёрнута в `<Link>` в `skills/page.tsx`. `<button>` внутри `<a>` — невалидный HTML (баг-класс). Решение: убрать внешний `<Link>` из `page.tsx`, навигацию перенести ВНУТРЬ `SkillCard` отдельным `<Link>` поверх тела карточки, а кнопку Aim сделать его **сиблингом** (`absolute`, `z-10`), не потомком. Клик по Aim попадает в кнопку (она сверху), не в ссылку.

## 4. Модель данных, миграция, контракты (это контракт)

### 4.1 Prisma-модели (добавить в `prisma/schema.prisma`)

```prisma
model PlanGoal {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id")
  skill       String   @db.VarChar(20)
  level       Int
  title       String   @db.VarChar(200)
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  mediumGoals PlanMediumGoal[]

  @@index([userId], map: "idx_plan_goals_user_id")
  @@map("plan_goals")
}

model PlanMediumGoal {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bigGoalId String   @map("big_goal_id") @db.Uuid
  title     String   @db.VarChar(200)
  completed Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  bigGoal   PlanGoal @relation(fields: [bigGoalId], references: [id], onDelete: Cascade)

  @@index([bigGoalId], map: "idx_plan_medium_goals_big_goal_id")
  @@map("plan_medium_goals")
}
```
В модель `User` добавить одну строку рядом с `skillProgress SkillProgress[]`:
```prisma
  planGoals PlanGoal[]
```
Примечание: частичный уникальный индекс (§4.2) Prisma DSL не выражает — он живёт ТОЛЬКО в SQL миграции. Prisma-клиент про него не знает, это ок (`prisma generate`/`migrate deploy` его не сверяют; `migrate dev` в проекте запрещён). НЕ пытаться выразить его в схеме.

### 4.2 Миграция (SQL, prisma-формат)

Папка `prisma/migrations/<YYYYMMDDHHMMSS>_add_plan_goals/migration.sql`. Timestamp получить `date +%Y%m%d%H%M%S`, он должен быть позже `20260709194149` (последняя миграция `add_skill_progress`). Файл:

```sql
-- CreateTable
CREATE TABLE "plan_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "skill" VARCHAR(20) NOT NULL,
    "level" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_medium_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "big_goal_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_medium_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_plan_goals_user_id" ON "plan_goals"("user_id");

-- CreateIndex  (partial unique: только одна АКТИВНАЯ большая цель на skill+level у юзера)
CREATE UNIQUE INDEX "idx_plan_goals_user_skill_level_active" ON "plan_goals"("user_id", "skill", "level") WHERE "completed" = false;

-- CreateIndex
CREATE INDEX "idx_plan_medium_goals_big_goal_id" ON "plan_medium_goals"("big_goal_id");

-- AddForeignKey
ALTER TABLE "plan_goals" ADD CONSTRAINT "plan_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_medium_goals" ADD CONSTRAINT "plan_medium_goals_big_goal_id_fkey" FOREIGN KEY ("big_goal_id") REFERENCES "plan_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Откат (в план, НЕ выполнять автоматически — миграция чисто аддитивна, безопасна на непустой БД):
```sql
DROP TABLE "plan_medium_goals";
DROP TABLE "plan_goals";
```
Применение только через `pnpm prisma:migrate` (`prisma migrate deploy`). НЕ `migrate dev`/`migrate reset` против Neon.

### 4.3 Доменный хелпер `src/lib/plan.ts` (новый, C1)

```ts
import { SKILLS, type SkillCode } from '@/lib/skills';

// "Complete lvl 3 of Speaking"
export function buildBigGoalTitle(skill: SkillCode, level: number): string {
  return `Complete lvl ${level} of ${SKILLS[skill].name}`;
}
```
Чистая функция — тестируется в C1.

### 4.4 Zod-схемы (добавить в `src/lib/validations.ts`, C1)

```ts
export const createBigGoalSchema = z.object({
  skill: z.enum(SKILL_CODES),
});

export const createMediumGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const toggleGoalSchema = z.object({
  completed: z.boolean(),
});
```
(`SKILL_CODES` уже импортирован в этом файле.)

### 4.5 Типы (добавить в `src/types/index.ts`, C0)

```ts
// Plan (goals)
export interface PlanMediumGoal {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}
export interface PlanBigGoal {
  id: string;
  skill: SkillCode;      // SkillCode уже импортирован в файле для Skills-типов
  level: number;
  title: string;
  completed: boolean;
  createdAt: string;
  mediumGoals: PlanMediumGoal[];
}
export interface PlanGoalsResponse { goals: PlanBigGoal[]; }
export interface CreateBigGoalResult { goal: PlanBigGoal; duplicate: boolean; }
export interface CreateMediumGoalResult { medium: PlanMediumGoal; }
```

### 4.6 API-контракты

Общий паттерн (эталон `src/app/api/skills/progress/route.ts`, `src/app/api/decks/[id]/route.ts`):
`const auth = await requireAuth(); if (auth instanceof NextResponse) return auth; const user = auth as TokenPayload;` → `userId = user.sub`. Тело: `await request.json().catch(() => null)` → `schema.safeParse` → 400 `jsonError(400, parsed.error.issues[0]?.message || 'Invalid input')`. Динамический сегмент — `{ params }: { params: Promise<{ id: string }> }`, `const { id } = await params`.

**GET `/api/plan/goals`** — список больших целей юзера с вложенными средними.
- `prisma.planGoal.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' }, include: { mediumGoals: { orderBy: { createdAt: 'asc' } } } })`.
- Один запрос (Prisma батчит include) — без N+1. Индекс `idx_plan_goals_user_id` покрывает `where`.
- 200: `{ goals: PlanBigGoal[] }` (даты → ISO-строки; маппить в форму §4.5). Ошибки: 401.

**POST `/api/plan/goals`** — создать большую цель из Aim.
- Тело `{ skill }` (`createBigGoalSchema`).
- Логика:
```ts
const progress = await prisma.skillProgress.findUnique({
  where: { userId_skill: { userId: user.sub, skill } },   // compound unique из SkillProgress
  select: { completedLevel: true },
});
const completed = progress?.completedLevel ?? 0;
if (completed >= 10) return jsonError(409, 'Skill already complete');
const level = completed + 1;
const title = buildBigGoalTitle(skill, level);
try {
  const goal = await prisma.planGoal.create({
    data: { userId: user.sub, skill, level, title },
    include: { mediumGoals: true },
  });
  return NextResponse.json({ goal: mapGoal(goal), duplicate: false });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    const dup = await prisma.planGoal.findFirst({
      where: { userId: user.sub, skill, level, completed: false },
      include: { mediumGoals: { orderBy: { createdAt: 'asc' } } },
    });
    if (dup) return NextResponse.json({ goal: mapGoal(dup), duplicate: true });
  }
  throw e; // не-P2002 → 500 (стандартно)
}
```
`Prisma` импортировать из `@prisma/client`. `mapGoal` — локальный маппер в форму `PlanBigGoal`. Ошибки: 400, 401, 409 (mastered). Гонка/двойной клик по Aim: partial-unique + P2002-ветка гарантируют один активный экземпляр.

**PATCH `/api/plan/goals/[id]`** — тоггл выполнения большой цели.
- Тело `{ completed }` (`toggleGoalSchema`).
- Атомарная проверка владения: `const res = await prisma.planGoal.updateMany({ where: { id, userId: user.sub }, data: { completed } });` (`updateMany.where` — скаляры, `userId` тут скаляр). `res.count === 0 → jsonError(404, 'Goal not found')`, иначе `NextResponse.json({ id, completed })`. Ошибки: 400, 401, 404.

**DELETE `/api/plan/goals/[id]`** — удалить большую цель (каскад средних).
- `const res = await prisma.planGoal.deleteMany({ where: { id, userId: user.sub } });` `count === 0 → 404`, иначе `NextResponse.json({ id })`. Ошибки: 401, 404.

**POST `/api/plan/goals/[id]/medium`** — создать среднюю цель под большой `[id]`.
- Тело `{ title }` (`createMediumGoalSchema`).
- Владение большой цели: `const big = await prisma.planGoal.findFirst({ where: { id, userId: user.sub }, select: { id: true } }); if (!big) return jsonError(404, 'Goal not found');`
- `const medium = await prisma.planMediumGoal.create({ data: { bigGoalId: id, title } });`
- 200: `{ medium: PlanMediumGoal }`. Ошибки: 400, 401, 404.

**PATCH `/api/plan/medium/[id]`** — тоггл средней цели.
- Тело `{ completed }` (`toggleGoalSchema`).
- Владение через связь (relation-фильтр допустим в `findFirst`, НО не в `updateMany`): `const owned = await prisma.planMediumGoal.findFirst({ where: { id, bigGoal: { userId: user.sub } }, select: { id: true } }); if (!owned) return jsonError(404, 'Goal not found');` затем `await prisma.planMediumGoal.update({ where: { id }, data: { completed } });`
- 200: `{ id, completed }`. Ошибки: 400, 401, 404.

**DELETE `/api/plan/medium/[id]`** — удалить среднюю цель.
- Владение так же через `findFirst({ where: { id, bigGoal: { userId } } })` → 404, затем `prisma.planMediumGoal.delete({ where: { id } })`.
- 200: `{ id }`. Ошибки: 401, 404.

**Матрица авторизации** (роль — только владелец; кросс-юзер невозможен):

| Эндпоинт | Метод | Условие доступа |
|---|---|---|
| `/api/plan/goals` | GET | `where.userId = user.sub` |
| `/api/plan/goals` | POST | создаёт с `userId = user.sub` |
| `/api/plan/goals/[id]` | PATCH/DELETE | `where { id, userId: user.sub }` → 404 если не владелец |
| `/api/plan/goals/[id]/medium` | POST | родитель `findFirst { id, userId }` → 404 |
| `/api/plan/medium/[id]` | PATCH/DELETE | `findFirst { id, bigGoal:{ userId } }` → 404 |

Эндпоинта без строки в матрице не существует.

### 4.7 Файлы роутов (C1)
- `src/app/api/plan/goals/route.ts` — GET + POST.
- `src/app/api/plan/goals/[id]/route.ts` — PATCH + DELETE.
- `src/app/api/plan/goals/[id]/medium/route.ts` — POST.
- `src/app/api/plan/medium/[id]/route.ts` — PATCH + DELETE.

## 5. Frontend: данные, компоненты, стили

### 5.1 Слой данных `src/lib/queries/plan.ts` (C2)
```ts
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { PlanGoalsResponse } from '@/types';

export const planKeys = { all: ['plan-goals'] as const };

export const planGoalsOptions = queryOptions({
  queryKey: planKeys.all,
  queryFn: () => fetchApi<PlanGoalsResponse>('/api/plan/goals'),
});
```

### 5.2 Хуки `src/hooks/use-plan.ts` (C2)
Эталон стиля — `use-skills.ts` (`useMutation` с `onMutate/onError` rollback / `onSettled invalidate`, `useToast`, `useQueryClient`). Хуки:
- `usePlanGoals()` → `useQuery(planGoalsOptions)`.
- `useCreateBigGoal()` (используется на `/skills` кнопкой Aim):
  - `mutationFn(skill: SkillCode)` → `fetchApi<CreateBigGoalResult>('/api/plan/goals', { method:'POST', body: JSON.stringify({ skill }) })`.
  - Без оптимистики (действие на другой странице). `onSuccess(data)`: `invalidateQueries(planKeys.all)`; тост `data.duplicate ? { type:'info', title:'Already in your plan' } : { type:'success', title:'Added to your plan' }`.
  - `onError`: тост `{ type:'error', title:'Couldn’t add — try again' }`.
- `useToggleBigGoal()`:
  - `mutationFn({ id, completed })` → PATCH `/api/plan/goals/${id}`.
  - **Оптимистично**: `onMutate` — `cancelQueries(planKeys.all)`, snapshot, локально выставить `completed` у большой цели по `id`. `onError` — откат + тост ошибки. `onSettled` — invalidate. Без тоста успеха.
- `useDeleteBigGoal()`:
  - `mutationFn(id)` → DELETE `/api/plan/goals/${id}`.
  - Оптимистично убрать цель из кэша `onMutate` (после того как компонент проиграл анимацию — mutate вызывается по завершении анимации, см. 5.6). `onError` — откат + тост `Couldn’t delete — try again`. `onSettled` — invalidate.
- `useCreateMediumGoal()`:
  - `mutationFn({ bigGoalId, title })` → POST `/api/plan/goals/${bigGoalId}/medium`.
  - **Оптимистично** добавить средний пункт с временным `id` (`crypto.randomUUID()`) в нужную большую цель; `onError` — откат + тост ошибки; `onSettled` — invalidate (реальный id подтянется).
- `useToggleMediumGoal()`:
  - `mutationFn({ id, completed })` → PATCH `/api/plan/medium/${id}`.
  - Оптимистично выставить `completed` у среднего пункта (найти по id внутри массивов). `onError` откат + тост. `onSettled` invalidate. Без тоста успеха.
- `useDeleteMediumGoal()`:
  - `mutationFn(id)` → DELETE `/api/plan/medium/${id}`.
  - Оптимистично убрать средний пункт `onMutate`; `onError` откат + тост; `onSettled` invalidate.

Общий helper внутри файла: чистая функция обновления `PlanGoalsResponse` (иммутабельно) — тоггл/добавление/удаление пунктов, чтобы не дублировать `setQueryData`-логику. `SkillCode`/типы — из `@/types` и `@/lib/skills`. 0 `any`.

### 5.3 Иконки (переиспользуем lucide, версия в проекте — проверить импортом)
- Aim-кнопка: `Target` (fallback `Crosshair`, если имя отсутствует в установленной версии — проверить импортом при исполнении).
- Nav «Plan»: `ListChecks` (тематически — чек-лист; отличается от `Target`/Aim и от `Trophy`/Skills).
- Чекбокс выполнено: `Check`. Мусорка: `Trash2`. Добавить: `Plus`. Свернуть/развернуть: `ChevronDown` (крутим `rotate-180` на open). Инлайн-инпут: `X` (отмена) / `Check` (создать).

### 5.4 Навигация `src/components/layout/AppLayout.tsx` (C2, точечная правка)
Добавить пункт `Plan` между Learn и Skills и импорт иконки. Итог `NAV_ITEMS`:
```ts
import { Layers, ListChecks, Trophy } from 'lucide-react';
const NAV_ITEMS = [
  { href: '/decks',  label: 'Learn',  Icon: Layers },
  { href: '/plan',   label: 'Plan',   Icon: ListChecks },
  { href: '/skills', label: 'Skills', Icon: Trophy },
];
```
Больше в файле НИЧЕГО не менять. `isActive` (startsWith) уже покрывает `/plan`. Таббар на <1024 станет из трёх вкладок — существующий `flex`/`flex-1` (`nav-tab { flex:1 }`) держит три равные колонки на 375px без переноса (три иконки+короткие подписи влезают). Стресс-проверка на 375: три `nav-tab` по ~125px — ок.

### 5.5 Точка входа Aim: `skills/page.tsx` + `SkillCard.tsx` (C2, правки)
**`src/app/(protected)/skills/page.tsx`** — убрать внешний `<Link>` вокруг карточки (сейчас `<Link ...><SkillCard/></Link>`). Стало:
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {SKILL_CODES.map((code) => (
    <SkillCard key={code} code={code} progress={data.progress[code]} />
  ))}
</div>
```
Навигация уезжает внутрь карточки. `Link` из `next/link` в page.tsx станет неиспользуемым — удалить импорт (свой мусор).

**`src/components/skills/SkillCard.tsx`** — карточку сделать `relative`, тело обернуть в `<Link href={`/skills/${code}`} className="block ...">` (переносит текущую разметку иконка/имя/прогресс/тизер как есть), а кнопку Aim добавить **сиблингом** ссылки:
```tsx
export default function SkillCard({ code, progress }: Props) {
  const { Icon, accent } = SKILL_META[code];
  const mastered = progress >= 10;
  // ...
  return (
    <div className="premium-card relative p-5 transition-colors hover:bg-(--surface-hover)">
      <Link href={`/skills/${code}`} className="block">
        {/* существующая разметка карточки без изменений, но добавить pr под кнопку в шапке */}
      </Link>
      <AimButton code={code} disabled={mastered} />  {/* absolute top-3 right-3 z-10 */}
    </div>
  );
}
```
Шапке карточки (строка иконка+имя) добавить `pr-12`, чтобы имя не заезжало под кнопку Aim (44px в правом верхнем углу). `<button>` — сиблинг `<Link>`, не потомок → валидный HTML, клик по Aim не навигирует.

**`src/components/skills/AimButton.tsx`** (новый, C2):
```tsx
'use client';
import { Target } from 'lucide-react';
import { useCreateBigGoal } from '@/hooks/use-plan';
import type { SkillCode } from '@/lib/skills';

export default function AimButton({ code, disabled }: { code: SkillCode; disabled: boolean }) {
  const create = useCreateBigGoal();
  return (
    <button
      type="button"
      onClick={() => create.mutate(code)}
      disabled={disabled || create.isPending}
      aria-label={disabled ? 'Skill complete — nothing to aim for' : 'Aim for the next level'}
      className="goal-aim-btn"   // круглая 44px кнопка, стили в globals (5.9)
    >
      <Target className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
```
Состояния Aim: default / hover / disabled (mastered или pending) / focus-visible. Никаких `stopPropagation` не требуется (сиблинг, не вложен). Не оборачивать в `Link`.

### 5.6 Страница и компоненты Plan (C2)

**`src/app/(protected)/plan/page.tsx`** (`'use client'`):
- `usePlanGoals()`. `isError` → `<ErrorMessage message="Couldn’t load your plan" onRetry={() => refetch()} />`; `isPending || !data` → `<LoadingSpinner />`.
- Заголовок `Plan` (`font-display text-3xl font-extrabold`, `var(--ink)`) + подзаголовок `Aim for a level, then break it into steps.`.
- Пустой список (`data.goals.length === 0`) → empty-состояние: иконка `Target` в кружке (accent green), заголовок `No goals yet`, текст `Go to Skills and tap the target on any skill to aim for your next level.` + `<Link href="/skills" className="button-ghost">Go to Skills</Link>`. Реалистичный, конкретный копирайт (не «achieve your dreams»).
- Иначе список: `<div className="mx-auto max-w-2xl space-y-4">{goals.map(g => <PlanGoalCard key={g.id} goal={g} />)}</div>`.

**`src/components/plan/PlanGoalCard.tsx`** (C2): props `{ goal: PlanBigGoal }`.
- Локальный стейт: `open: boolean` (свёрнута по умолчанию), `adding: boolean` (показан ли инлайн-инпут), `confirmDelete: boolean`, `deleting: boolean` (проигрывается ли fade/collapse удаления).
- Хуки: `useToggleBigGoal`, `useDeleteBigGoal`, `useCreateMediumGoal`.
- Разметка (карточка `premium-card p-4`, при `deleting` — класс анимации fade/collapse):
  - **Шапка** (`flex items-start gap-3`): `<GoalCheckbox checked={goal.completed} onToggle={() => toggleBig.mutate({ id: goal.id, completed: !goal.completed })} accent="var(--duo-green)" />` + `<GoalLabel text={goal.title} completed={goal.completed} className="flex-1 min-w-0 font-display font-extrabold text-lg" />`. **`min-w-0` на лейбле обязателен** (flex-1 + возможный перенос — без него текст выдавит layout).
  - **Collapse-регион** (плавная высота): `<div className="plan-collapse" data-open={open}><div className="plan-collapse-inner">` → внутри: список средних `<ul className="space-y-2 pt-3">{goal.mediumGoals.map(m => <MediumGoalRow key={m.id} bigGoalId={goal.id} medium={m} />)}</ul>` + (если `adding`) `<AddMediumInput bigGoalId={goal.id} onDone={() => setAdding(false)} />`.
  - **Футер** (`pt-3`): если `!open` → одна центрированная кнопка `ChevronDown` (`goal-icon-btn`, `aria-label="Expand goal"`, `aria-expanded={false}`). Если `open` → ряд `flex items-center justify-between`: слева мусорка (`goal-icon-btn goal-icon-btn--danger`, `aria-label="Delete goal"`, `onClick={() => setConfirmDelete(true)}`), в центре `ChevronDown` с `rotate-180` (`aria-label="Collapse goal"`, `aria-expanded`), справа «+» (`goal-icon-btn`, `aria-label="Add a step"`, `onClick={() => { setOpen(true); setAdding(true); }}`).
  - **Модалка**: если `confirmDelete` → `<ConfirmDialog title="Delete goal?" message="Do you really want to delete this goal?" confirmLabel="Yes" cancelLabel="No" onCancel={() => setConfirmDelete(false)} onConfirm={handleConfirmDelete} />`.
- `handleConfirmDelete`: `setConfirmDelete(false); setDeleting(true);` затем по завершении анимации (`onAnimationEnd` контейнера или `setTimeout(DUR)`, `DUR=0` при reduced-motion) → `deleteBig.mutate(goal.id)` (оптимистично уберёт из кэша). Таймер в `useRef`, очистка в cleanup.
- Состояния карточки: default / expanded / adding / deleting / (чекбокс: checked/unchecked, pending).

**`src/components/plan/MediumGoalRow.tsx`** (C2): props `{ bigGoalId: string; medium: PlanMediumGoal }`.
- Стейт: `confirmDelete`, `phase: 'idle' | 'deleting'`.
- Хуки: `useToggleMediumGoal`, `useDeleteMediumGoal`.
- Разметка обёртки для схлопывания места: `<li className="plan-row" data-phase={phase}>` (в `deleting` включает keyframes сжатия+частиц+вспышки+height-collapse):
  - `<div className="flex items-start gap-3">` → `<GoalCheckbox checked={medium.completed} onToggle={() => toggleMed.mutate({ id: medium.id, completed: !medium.completed })} accent="var(--duo-green)" size="sm" />` + `<GoalLabel text={medium.title} completed={medium.completed} className="flex-1 min-w-0 text-sm font-bold" />` + `<button className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--danger" aria-label="Delete step" onClick={() => setConfirmDelete(true)}><Trash2 .../></button>`. **`min-w-0` на лейбле обязателен** (иначе длинный текст средней цели выдавит мусорку за край — баг-класс flex-1+truncate/wrap).
  - Слой частиц/вспышки рендерится только при `phase==='deleting'` и `!reduceMotion`: `<span className="plan-particles" aria-hidden>{Array.from({length:12}).map((_,i)=><span style={{'--a':`${i*30}deg`} as CSSProperties}/>)}</span>` + `<span className="plan-check-flash" aria-hidden><Check/></span>` (по образцу `skill-burst`/`celebration-confetti`).
  - Модалка: `<ConfirmDialog title="Delete goal?" message="Do you really want to delete this goal?" confirmLabel="Yes" cancelLabel="No" .../>`.
- `handleConfirmDelete`: `setConfirmDelete(false); setPhase('deleting');` → по завершении (`setTimeout(TOTAL)`, `TOTAL≈800ms`; при reduced-motion `TOTAL=0` и без слоёв частиц) → `deleteMed.mutate(medium.id)`. Таймер в ref, cleanup.
- Состояния: default / checked / pending / deleting.

**`src/components/plan/AddMediumInput.tsx`** (C2): props `{ bigGoalId: string; onDone: () => void }`.
- Стейт `value`. `useCreateMediumGoal`. `inputRef` + `useEffect(() => inputRef.current?.focus(), [])` — автофокус.
- Разметка: `<div className="pt-2">` → `<input ref={inputRef} className="goal-input" placeholder="New step…" value={value} onChange onKeyDown />` + ряд мини-кнопок под ним (`flex gap-2 pt-2`): `X` (`goal-icon-btn goal-icon-btn--sm`, cancel → `onDone()`) и `Check` (`goal-icon-btn goal-icon-btn--sm goal-icon-btn--confirm`, submit).
- `onKeyDown`: `Enter` → submit, `Escape` → `onDone()`.
- `submit`: `const t = value.trim(); if (!t) return; create.mutate({ bigGoalId, title: t }); onDone();` (закрываем инпут; для добавления ещё одного — юзер жмёт «+» снова).
- Состояния: default / focused / (кнопка confirm disabled при пустом trim). Инпут — не голый нативный: класс `goal-input` (§5.9). Инпут инлайновый (в карточке), НЕ fixed → не попадает под таббар.

**`src/components/plan/GoalCheckbox.tsx`** (C2): props `{ checked; onToggle; accent; size?: 'sm'|'md' }`.
- НЕ нативный `<input type=checkbox>`. `<button type="button" role="checkbox" aria-checked={checked} onClick={onToggle} className="goal-checkbox">` — круг 28px (md) / 24px (sm), 2px border `var(--rule)`; при `checked` — заливка accent + `<Check>` белым, лёгкий pop (`animation: pop 0.28s`). Хит-зона padding до ≥44px (визуальный круг меньше). focus-visible-обводка.
- Состояния: unchecked / checked / hover / focus.

**`src/components/plan/GoalLabel.tsx`** (C2): props `{ text; completed; className? }` — текст + каракуля-зачёркивание.
- `<span className={`goal-label ${className}`} data-done={completed}>{text}` + (если `completed`) `<GoalScribble />`</span>`. Контейнер `position:relative; display:inline-block; max-width:100%`. При `completed` — текст приглушается (`color: var(--ink-soft)`), сверху рисуется каракуля.

**`src/components/plan/GoalScribble.tsx`** (C2): фирменная «рукописная» зачёркивающая каракуля.
- SVG-оверлей, НЕ влияет на layout (текст переносится нормально под ним): `position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible`.
```tsx
export default function GoalScribble() {
  return (
    <svg className="goal-scribble" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
      <path
        pathLength={1}
        d="M1 7 C 12 3, 20 10, 32 6 S 52 3, 64 8 S 86 4, 99 6"
        fill="none" stroke="var(--scribble)" strokeWidth={2.4}
        strokeLinecap="round" vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
```
- `preserveAspectRatio="none"` растягивает по ширине текста; `vectorEffect="non-scaling-stroke"` держит толщину линии постоянной при растяжении; `pathLength={1}` → в CSS `stroke-dasharray:1; stroke-dashoffset:1` и анимация `→0` (draw-on ~380ms ease-out). Волнистая `C/S`-кривая читается как размашистая ручная загогулина, а не прямая линия.
- Многострочный текст: оверлей `inset:0` перекрывает весь блок; каракуля идёт по вертикальному центру блока — кросс-аут читается и на 2 строках, при этом перенос строк текста НЕ ломается (SVG абсолютный, вне потока). Это осознанное решение против бага «зачёркивание рвёт перенос».
- `--scribble` дефолт `var(--duo-green)` (завершение = зелёный, на бренде); задаётся в `goal-label[data-done]` (§5.9). reduced-motion → нарисована сразу (`stroke-dashoffset:0`, без transition).

### 5.7 Правка `src/components/ui/ConfirmDialog.tsx` (C2, аддитивно)
Добавить опциональный проп `cancelLabel?: string` (дефолт `'Cancel'`) и подставить его в текст кнопки отмены (сейчас захардкожено `Cancel`). Ничего больше не менять — существующие вызовы (decks) продолжают работать с дефолтом. Это единственная правка файла; владелец — C2.

### 5.8 Карта зон и слоёв (fixed/overlay) — во избежание конфликтов
- Контент/карточки Plan: обычный поток внутри `AppLayout main` (`max-w-5xl`, `pb-24 lg:pb-0`). Наши элементы НЕ добавляют своих fixed/sticky-зон (инлайн-инпут, футер, частицы — все в потоке карточки) → ничего не уходит под нижний таббар (`nav-tabbar`, `z-40`).
- Частицы/вспышка удаления — `absolute` внутри своей `<li>`/карточки (не fixed), `pointer-events:none`.
- Модалка — существующий `ConfirmDialog` через портал в `document.body`, `z-50` (фикс. значение из компонента). Тосты — `z-[1000]` (портал). `LevelCelebration` (не в этой фиче) — `z-1100`. Порядок слоёв: контент(<40) < nav(40) < ConfirmDialog(50) < тосты(1000). Никаких новых произвольных z-index в фиче не вводим.

### 5.9 Новые стили в `globals.css` (C2)
Дописать в КОНЕЦ файла новой секцией `Plan (goals)` — по образцу существующих `skill-path-*`/`level-celebration-*` (плоские классы без `@layer`; в проекте это уже сложившаяся конвенция и конфликта с utility-классами тут нет, т.к. имена уникальные `goal-*`/`plan-*`). Не плодить дублирующих токенов — цвета из duo-переменных, отступы/радиусы существующие (16px радиус карточек, 48px min-height кнопок и т.п.). Нужны:
- `.goal-aim-btn` — круглая 44×44 кнопка Aim: `border-radius:50%`, `border:2px solid var(--rule)`, фон `#fff`, иконка `color: var(--duo-green)`; hover `background: var(--duo-green-haze)`; `:disabled { opacity:.4; cursor:not-allowed }`; `:focus-visible` обводка `var(--color-accent-ring)`. `display:grid; place-items:center`.
- `.goal-icon-btn` — круглая кнопка действий: визуальный круг ~40px, но `min-width:44px; min-height:44px` (хит-зона ≥44 — п.13/интерактив), `display:grid; place-items:center; border-radius:50%`, `--sm` вариант (визуал ~34px, хит-зона всё равно 44 через padding). Модификаторы: `--danger` (иконка `var(--duo-red)`, hover фон `var(--danger-soft)`), `--confirm` (иконка `var(--duo-green)`, hover `var(--duo-green-haze)`). `:focus-visible` обводка. `btn-spring`-подобный `:active { transform: scale(.94) }`.
- `.goal-checkbox` (+`--sm`) — круг 28/24px, `border:2px solid var(--rule)`; `[aria-checked=true] { background: var(--accent, var(--duo-green)); border-color: transparent; color:#fff }`; хит-зона 44 через паддинг-обёртку/`::after`. `:focus-visible` обводка.
- `.goal-input` — стилизованный инпут (НЕ голый нативный): `width:100%`, `border:2px solid var(--rule)`, `border-radius:12px`, `padding:.6rem .8rem`, `font: inherit`, `:focus { border-color: var(--duo-green); outline:none }`, placeholder `var(--ink-soft)`.
- `.goal-label` — `position:relative; display:inline-block; max-width:100%; word-break:break-word`; `&[data-done] { color: var(--ink-soft); --scribble: var(--duo-green) }`.
- `.goal-scribble` — `position:absolute; left:0; top:0; width:100%; height:100%; overflow:visible; pointer-events:none`; path `stroke-dasharray:1; stroke-dashoffset:1; animation: goal-scribble-draw 380ms ease-out forwards`.
- `.plan-collapse` — `display:grid; grid-template-rows:0fr; transition: grid-template-rows 240ms ease-out`; `&[data-open="true"] { grid-template-rows:1fr }`. `.plan-collapse-inner { overflow:hidden; min-height:0 }`.
- `.plan-row` — обёртка средней цели; `&[data-phase="deleting"]` запускает `animation: plan-row-out 800ms ease forwards` (композит: 0–20% scale .85 + fade контента, 20–70% частицы уже летят, 60–100% height/opacity collapse). Практично реализовать двумя слоями: внутренний контент `plan-row-shrink`, обёртка `plan-row-collapse` (height через grid-rows 1fr→0fr в конце).
- `.plan-particles span` — 12 точек, `position:absolute; left:50%; top:50%; width:6px; height:6px; border-radius:50%; background: var(--duo-green)`; `animation: plan-particle .5s ease-out forwards` c `transform: rotate(var(--a)) translateY(-32px) scale(.3); opacity:0` в конце (по образцу `skill-burst-dot`).
- `.plan-check-flash` — центр, круг с `Check`, `animation: plan-check .45s ease-out .15s both` (scale 0→1.2→1, затем fade).
- keyframes: `goal-scribble-draw` (dashoffset 1→0), `plan-row-shrink`, `plan-row-collapse`, `plan-particle`, `plan-check`. Все на `transform/opacity`/`grid-template-rows` (не на `width/top/left`).
- В существующий блок `@media (prefers-reduced-motion: reduce)` полагаемся (он глобально гасит `animation`/`transition`); дополнительно в JS ветки удаления при reduced-motion НЕ рендерим слои частиц и ставим `TOTAL=0` (мгновенное удаление). Проверить `window.matchMedia('(prefers-reduced-motion: reduce)').matches` в компонентах удаления.

## 6. Лейаут на 375 / 768 / 1440 (каждый элемент — на трёх ширинах)

- **Контейнер Plan:** одна колонка, `max-w-2xl mx-auto` (как лестница скиллов) на всех ширинах — длинные заголовки читаются, на 1440 не растягивается на пол-экрана.
- **Nav (три пункта):** 1440/768 — топбар-пиллы в ряд; <1024 — таббар из трёх равных `flex-1` вкладок. 375: три вкладки ~125px, иконка+короткая подпись (`Learn/Plan/Skills`) влезают, без переноса. Спроектировано явно (не `flex-wrap`).
- **Карточка скилла + Aim (сетка `/skills`):** 375 — 1 колонка; 768 — 2 (`sm:grid-cols-2`); 1440 — 3 (`lg:grid-cols-3`). Aim-кнопка 44px `absolute top-3 right-3`; шапке карточки `pr-12`, чтобы имя скилла не заезжало под кнопку на узкой карточке (стресс — длинное имя не выдавливает кнопку, т.к. кнопка вне потока + `pr` резервирует место).
- **Большая цель (карточка):** шапка `checkbox + label(min-w-0)` — на 375 длинный заголовок переносится в несколько строк, чекбокс остаётся слева сверху (`items-start`). Футер-ряд `[мусорка][шеврон][+]` — три 44px-кнопки `justify-between`; на 375 между ними достаточно места (максимальная ширина карточки − 3×44 ≈ хватает). Спроектировано как ряд из трёх, а не перенос.
- **Средняя цель:** `checkbox + label(min-w-0, flex-1) + trash`. 375 — длинный текст (до 200 симв., юникод) переносится, `min-w-0` не даёт выдавить мусорку за край; мусорка прижата справа `items-start`.
- **Инлайн-инпут:** `width:100%` в карточке на всех ширинах; мини-кнопки крестик/галочка под инпутом отдельным рядом (не сбоку — на 375 не сжимаются). Не под таббаром (инлайн в потоке).
- **Модалка:** `ConfirmDialog` уже центрируется с `p-6`, `max-w-md w-full` — на 375 вписывается с полями.
- Нет элементов на фикс-ширину; всё переносится/масштабируется. Горизонтального скролла нет.

## 7. Анимации (сводка — 150–300ms где не оговорено, transform/opacity, ease-out)

| Что | Свойство | Длит. | Примечание |
|---|---|---|---|
| Раскрытие/сворачивание карточки | `grid-template-rows` | 240ms ease-out | grid-rows trick, без JS |
| Чекбокс check | `transform/opacity` (`pop`) | 280ms | существующий `@keyframes pop` |
| Каракуля зачёркивания | `stroke-dashoffset` | 380ms ease-out | draw-on, фирменная деталь |
| Появление модалки | opacity/backdrop/scale | 300–400ms | из `ConfirmDialog` (как есть) |
| Появление тоста | gsap x/opacity | ~500ms | из `Toast` (как есть) |
| Удаление средней цели | shrink+particles+flash+collapse | ~800ms | **осознанное исключение >300ms** — покадровый сториборд руководителя; только transform/opacity/grid-rows; reduced-motion → мгновенно |
| Удаление большой цели | fade+scale+height collapse | ~300ms | проще, без частиц |
| Aim/иконочные кнопки press | `transform: scale(.94)` | 120ms | как `btn-spring` |

Все — под глобальным `prefers-reduced-motion` гасителем; удаление дополнительно ветвится в JS (без частиц, `TOTAL=0`).

## 8. Разбивка на куски (непересекающиеся по файлам)

Порядок: **C0** первым (типы), затем **C1** (backend) и **C2** (frontend) параллельно — они не делят файлы. C2 при билд-верификации опирается на типы из C0; рантайм-смоук фронта — на C1, поэтому финальный смоук на гейте (§10). Все исполнители — **Sonnet**.

### Кусок C0 — Типы (Sonnet, первым)
Файлы (владелец — только C0):
- `src/types/index.ts` (правка) — добавить `PlanMediumGoal`, `PlanBigGoal`, `PlanGoalsResponse`, `CreateBigGoalResult`, `CreateMediumGoalResult` (§4.5). `SkillCode` уже импортирован в файле — переиспользовать. Существующие типы не трогать.
Готово, когда: `pnpm build` (typecheck) + `pnpm lint` зелёные.

### Кусок C1 — Backend (Sonnet, после C0)
Файлы (владелец — только C1):
- `prisma/schema.prisma` (правка) — модели `PlanGoal`, `PlanMediumGoal` + строка `planGoals PlanGoal[]` в `User` (§4.1).
- `prisma/migrations/<ts>_add_plan_goals/migration.sql` (новый) — §4.2 (включая частичный уникальный индекс).
- `src/lib/plan.ts` (новый) — `buildBigGoalTitle` (§4.3).
- `src/lib/validations.ts` (правка) — `createBigGoalSchema`, `createMediumGoalSchema`, `toggleGoalSchema` (§4.4).
- `src/app/api/plan/goals/route.ts` (новый) — GET + POST (§4.6).
- `src/app/api/plan/goals/[id]/route.ts` (новый) — PATCH + DELETE.
- `src/app/api/plan/goals/[id]/medium/route.ts` (новый) — POST.
- `src/app/api/plan/medium/[id]/route.ts` (новый) — PATCH + DELETE.
- `tests/unit/plan-goal-title.test.ts` (новый) — тесты `buildBigGoalTitle` (формат `Complete lvl N of Name` для нескольких скиллов/уровней).
Готово, когда: миграция применяется на чистой БД; эндпоинты отвечают по контракту (в т.ч. 400/401/404/409, дедуп `duplicate:true`); авторизация берёт `userId` из сессии; тесты проходят.
Проверка: `pnpm prisma:migrate` (dev/local) + `pnpm test` + ручной смоук (§10 п.5) + `pnpm build`.

### Кусок C2 — Frontend (Sonnet, после C0, параллельно с C1)
Файлы (владелец — только C2):
- `src/lib/queries/plan.ts` (новый) — §5.1.
- `src/hooks/use-plan.ts` (новый) — §5.2.
- `src/components/plan/PlanGoalCard.tsx`, `MediumGoalRow.tsx`, `AddMediumInput.tsx`, `GoalCheckbox.tsx`, `GoalLabel.tsx`, `GoalScribble.tsx` (новые) — §5.6.
- `src/components/skills/AimButton.tsx` (новый) — §5.5.
- `src/app/(protected)/plan/page.tsx` (новый) — §5.6.
- `src/components/skills/SkillCard.tsx` (правка) — Link внутрь + Aim сиблингом (§5.5).
- `src/app/(protected)/skills/page.tsx` (правка) — убрать внешний Link (§5.5).
- `src/components/layout/AppLayout.tsx` (правка) — пункт `Plan` (§5.4).
- `src/components/ui/ConfirmDialog.tsx` (правка) — аддитивный `cancelLabel` (§5.7).
- `src/app/globals.css` (правка) — секция `Plan (goals)` в конец (§5.9).
Готово, когда: `/plan` рендерит loading/error/empty/список; карточка разворачивается плавно; средние цели создаются/тогглятся/удаляются с анимацией; скрайбл рисуется; Aim на `/skills` создаёт цель (успех/дубликат тосты) и не навигирует; лейаут ок на 375/768/1440; мутации оптимистичны с откатом.
Проверка: `pnpm build && pnpm lint`; визуально сценарий UI (§10 п.5) — при готовом C1 или на моке ответа.

## 9. Запреты для исполнителей (обязательно)

- НЕ трогать файлы вне своего куска (параллельная работа в одном дереве). Нужен baseline чужого файла — `git show HEAD:<файл>`.
- НЕ менять контракты §4 / типы / существующие эндпоинты / схему вне описанного. Надо изменить контракт — стоп, вернуть на ревью, не править молча.
- НЕ трогать фичу Skills сверх правок в §5.5 (SkillCard/skills page — только Aim-интеграция) и спеку/маршруты `/map`, `011-skill-map-canvas`.
- ЗАПРЕЩЕНЫ `git stash`, `git reset`, `git checkout .`, `git clean`, любые деструктивные git-операции; **НЕ коммитить и НЕ пушить** (git только на чтение).
- ЗАПРЕЩЕНЫ операции с рабочей (Neon) БД кроме применения аддитивной миграции §4.2 через `pnpm prisma:migrate`. Никаких `migrate reset`/`migrate dev`/`DROP`/ручных правок данных.
- НЕ убивать dev-сервер на `:3000` (может быть запущен руководителем).
- Новых npm-зависимостей НЕ добавлять. Новых глобальных токенов не плодить — цвета/радиусы/отступы из существующих (§5.9). Новые классы — только уникальные `goal-*`/`plan-*` в конец `globals.css`.
- 0 `any`; без `dangerouslySetInnerHTML`; иконочные кнопки — с `aria-label`; интерактив — семантический `<button>`, не `div`; `type="button"` на всех не-submit кнопках.

## 10. Гейт всей фичи (после C1+C2, до сдачи)

Порядок (из корня проекта):
1. `pnpm prisma:migrate` — применить аддитивную миграцию (`plan_goals`, `plan_medium_goals`, частичный уникальный индекс).
2. `pnpm build` — `prisma generate` + `next build`, без ошибок типов (0 `any`).
3. `pnpm lint` — чисто.
4. `pnpm test` — включая `tests/unit/plan-goal-title.test.ts`.
5. Смоук вручную (dev-сессия под залогиненным юзером):
   - `POST /api/plan/goals {skill:'speaking'}` (скилл на 0/10) → 200 `{ goal:{ title:'Complete lvl 1 of Speaking', level:1 }, duplicate:false }`.
   - Повтор того же → 200 `{ duplicate:true }` (дедуп, второй не создан).
   - `GET /api/plan/goals` → 200, цель есть, `mediumGoals:[]`.
   - `POST /api/plan/goals/{id}/medium {title:'Practice 10 min'}` → 200 `{ medium }`.
   - `PATCH /api/plan/medium/{mid} {completed:true}` → 200; `PATCH /api/plan/goals/{id} {completed:true}` → 200.
   - `DELETE /api/plan/medium/{mid}` → 200; `DELETE /api/plan/goals/{id}` → 200.
   - Кросс-юзер: `PATCH/DELETE` чужого `id` → **404**. Без сессии → **401**. Битое тело (`{skill:'foo'}` / `{title:''}`) → **400**.
   - UI: nav `Learn|Plan|Skills`; `/skills` — Aim на карточке (10/10 disabled), клик не навигирует, тост Added / повтор Already; `/plan` — пусто→empty-состояние; после Aim появилась карточка; раскрытие плавное; «+»→инпут автофокус, Enter создаёт, Escape отменяет; чекбоксы тогглятся, скрайбл рисуется; мусорка→модалка No/Yes; Yes на средней→анимация распада и схлопывание; Yes на большой→fade; проверить 375/768/1440 без горизонт. скролла и не под таббаром; `prefers-reduced-motion` — без частиц, мгновенно.

## 11. Что добавили скиллы-ревьюеры (сверх исходных требований лида)

Прогнано: `vercel-plugin:react-best-practices`, `vercel-plugin:nextjs`, security-проход, «Запреты backend-багов», `frontend-ui-design-reviewer`. Добавлено 12 пунктов:

- **frontend-ui-design-reviewer:** (1) `min-w-0` обязателен на `flex-1`-лейблах большой и средней цели — иначе длинный текст выдавит чекбокс/мусорку за край (п.2 чеклиста). (2) Кнопка Aim 44px `absolute` + шапке скилл-карточки `pr-12`, чтобы имя не заезжало под кнопку (п.1/9 — стресс длинным именем). (3) Инлайн-инпут и футер — инлайн в потоке карточки, не fixed → не под таббаром (п.3). (4) Карта зон/z-index зафиксирована, новых произвольных z-index нет (п.4/16). (5) Все контролы — не голые нативные: `goal-checkbox` (кастомный, не `<input type=checkbox>`), `goal-input` стилизован (п.5). (6) Ни одного молчаливого действия: Aim/создание/ошибки — тосты, тоггл — оптимистика+скрайбл, удаление — анимация (п.6). (7) Модалка вместо `confirm()` (п.7). (8) Мобильный лейаут спроектирован явно (три nav-вкладки, футер-ряд из трёх, мини-кнопки под инпутом), не `flex-wrap` наугад (п.19/20). (9) Каракуля — абсолютный SVG-оверлей, не рвёт перенос текста, толщина не скачет (`vectorEffect`) (п.17).
- **react-best-practices / nextjs:** (10) все страницы/интерактив — `'use client'`; параметры роутов на сервере — `await params` (Promise); мутации `onMutate/onError` rollback + `onSettled invalidate`; стабильные ключи списков (`goal.id`/`medium.id`); таймеры анимаций в `useRef` с cleanup; 0 `any`.
- **security / backend-bug-bans:** (11) `userId` только из `user.sub`, никогда из тела — на всех 8 операциях; zod на границе каждого POST/PATCH; матрица авторизации (§4.6) покрывает каждый эндпоинт, кросс-юзер → 404; дедуп и гонка Aim закрыты частичным уникальным индексом + P2002-веткой (двойной клик не создаёт дубль); GET — один `findMany` с `include` (без N+1), индексы на `user_id` и `big_goal_id`; каскады `ON DELETE` чистят средние и при удалении большой цели, и при удалении юзера; миграция аддитивна, откат задокументирован. (12) Ошибки не проглатываются молча: P2002 обрабатывается явно (дедуп), прочие ошибки пробрасываются (500), клиентские фейлы — тост + rollback.
