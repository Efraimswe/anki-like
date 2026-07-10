# План: фича «Skills» (Lexa)

Вид: Production (frontend + backend). Фаза A — планирование. Стек проекта: Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4, TanStack Query v5, Prisma 6 (Postgres/Neon), Zod, Clerk, lucide-react, pnpm. Стили — существующие CSS-переменные/классы из `globals.css` (Tailwind 4 без отдельного config). Tailwind остаётся (он уже в проекте) — новых зависимостей НЕ добавляем.

---

## 1. Цель

У пользователя ровно 6 фиксированных навыков (Speaking, Reading, Listening, Writing, Vocabulary, Grammar), у каждого 10 уровней. Пользователь помечает уровень как completed строго по порядку (следующий заблокирован, пока не пройден предыдущий). Условие текущего уровня видно сразу; условия будущих уровней скрыты, но раскрываются кнопкой «peek». Фича живёт на своей странице `/skills` (пункт в основной навигации). Контент уровней хардкодится в коде (константа), в БД хранится только прогресс.

## 2. Критерии готовности (Definition of Done)

1. `/skills` доступен из основной навигации (топбар ≥1024px и нижний таббар <1024px), помечается активным на своих маршрутах.
2. Обзорная страница показывает 6 карточек навыков с прогрессом (X/10, прогресс-бар) и одностроч­ным тизером текущего уровня.
3. Страница навыка показывает лестницу из 10 уровней: completed отмечены, текущий выделен и имеет кнопку «Mark complete», будущие скрыты (текст спрятан) до нажатия «Peek ahead».
4. «Mark complete» повышает прогресс на 1 (только для текущего уровня); доступен откат последнего пройденного уровня («Undo»/«Mark as not done»).
5. Сервер валидирует последовательность: завершить можно только `completedLevel+1`, откатить — только текущий `completedLevel`; нарушение → 409. Гонки/двойные клики не ломают прогресс (атомарный условный UPDATE).
6. userId берётся ТОЛЬКО из сессии (Clerk), никогда из тела запроса. Оба эндпоинта под auth.
7. Каждое действие даёт видимую реакцию ≤200 мс (оптимистичный апдейт + тост); ошибка откатывает состояние и показывает тост.
8. Состояния loading / error / invalid-param обработаны по паттернам приложения (`LoadingSpinner`, `ErrorMessage`).
9. Аккуратно на 375 / 768 / 1440. Нет горизонтального скролла, контент не под нижним таббаром, интерактив ≥44px.
10. Гейт фичи зелёный: `pnpm build` + `pnpm lint` + `pnpm test` + применённая миграция + смоук (см. §7).

## 3. Ключевые решения (зафиксировано)

- **Контент в коде.** `src/lib/skills.ts` — единственный источник текстов уровней. В БД только `completedLevel`.
- **Одна таблица прогресса** `skill_progress`: `(userId, skill)` уникально, `completedLevel Int 0..10`. Отсутствие строки = 0.
- **Два маршрута, а не аккордеон.** `/skills` (обзор, 6 карточек) → `/skills/[skill]` (лестница). Это повторяет существующий паттерн `decks → decks/[id]`, держит каждый экран простым и даёт чистое разбиение файлов по кускам. 6 аккордеонов по 10 уровней на одной странице — тяжелее и по состоянию, и по скроллу; отклонено.
- **Peek — один тумблер на навык** (не per-level): «Peek ahead» / «Hide upcoming» вверху лестницы, раскрывает тексты всех будущих уровней. Проще для пользователя и для реализации. Будущие уровни при раскрытии остаются НЕинтерактивными (нельзя пройти вне очереди).
- **Контракт мутации защищает от двойного клика.** Тело несёт `{ skill, level, action }`; сервер применяет изменение атомарным условным UPDATE по ожидаемому предыдущему значению — повтор того же запроса не увеличивает прогресс второй раз (даёт 409), гонки сходятся к корректному значению.
- **Откат последнего уровня включён** (мисклик дёшево исправить) — `action: 'uncomplete'` откатывает только текущий `completedLevel`.
- **Параметр `[skill]` — через `useParams()`** (страница клиентская), с валидацией по списку кодов; невалидный код → `ErrorMessage` + ссылка назад.

## 4. Модель данных, контракты, тексты (это контракт — исполнители не меняют его молча)

### 4.1 Prisma-модель (добавить в `prisma/schema.prisma`)

```prisma
model SkillProgress {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @map("user_id")
  skill          String   @db.VarChar(20)
  completedLevel Int      @default(0) @map("completed_level")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skill], map: "idx_skill_progress_user_skill")
  @@map("skill_progress")
}
```
И в модель `User` добавить обратную связь одной строкой рядом с `decks Deck[]`:
```prisma
  skillProgress SkillProgress[]
```

### 4.2 Миграция (SQL, prisma-формат)

Папка `prisma/migrations/<YYYYMMDDHHMMSS>_add_skill_progress/migration.sql` (timestamp получить `date +%Y%m%d%H%M%S`, он должен быть позже `20260605192834`). Файл:

```sql
-- CreateTable
CREATE TABLE "skill_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "skill" VARCHAR(20) NOT NULL,
    "completed_level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_skill_progress_user_skill" ON "skill_progress"("user_id", "skill");

-- AddForeignKey
ALTER TABLE "skill_progress" ADD CONSTRAINT "skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Откат (в план, НЕ выполнять автоматически — additive-миграция безопасна): `DROP TABLE "skill_progress";`. Миграция чисто аддитивная (новая таблица, чужих не трогает), поэтому безопасна на непустой БД; применение только через `pnpm prisma:migrate` (`prisma migrate deploy`) на гейте. НЕ использовать `migrate dev`/`migrate reset` против рабочей Neon-БД (нужен shadow DB и это тронет прод) — миграция пишется руками в формате выше, `prisma generate` (внутри `pnpm build`) подхватит модель.

### 4.3 Контент и домен: `src/lib/skills.ts` (новый, C0)

```ts
export const SKILL_CODES = [
  'speaking', 'reading', 'listening', 'writing', 'vocabulary', 'grammar',
] as const;
export type SkillCode = (typeof SKILL_CODES)[number];

export const MAX_LEVEL = 10;

export interface SkillDef {
  code: SkillCode;
  name: string;       // отображаемое имя (English)
  levels: string[];   // ровно 10 строк; индекс 0 = уровень 1
}

export const SKILLS: Record<SkillCode, SkillDef> = {
  speaking:   { code: 'speaking',   name: 'Speaking',   levels: [/* 10 строк из §4.6 */] },
  reading:    { code: 'reading',    name: 'Reading',    levels: [/* ... */] },
  listening:  { code: 'listening',  name: 'Listening',  levels: [/* ... */] },
  writing:    { code: 'writing',    name: 'Writing',    levels: [/* ... */] },
  vocabulary: { code: 'vocabulary', name: 'Vocabulary', levels: [/* ... */] },
  grammar:    { code: 'grammar',    name: 'Grammar',    levels: [/* ... */] },
};

export function isSkillCode(v: string): v is SkillCode {
  return (SKILL_CODES as readonly string[]).includes(v);
}

// уровень 1..10 → текст условия
export function skillLevelText(code: SkillCode, level: number): string {
  return SKILLS[code].levels[level - 1] ?? '';
}

// Чистая доменная функция последовательности — тестируется в C1.
// Возвращает новое значение completedLevel или null, если действие недопустимо.
export function nextCompletedLevel(
  current: number,
  level: number,
  action: 'complete' | 'uncomplete',
): number | null {
  if (level < 1 || level > MAX_LEVEL) return null;
  if (action === 'complete')   return level === current + 1 ? level : null;
  if (action === 'uncomplete') return level === current ? level - 1 : null;
  return null;
}
```
Тексты уровней (все 60) взять дословно из §4.6. Каждый массив `levels` длиной ровно 10; порядок = уровни 1→10.

### 4.4 Zod-схема (добавить в `src/lib/validations.ts`, C1)

```ts
import { SKILL_CODES } from './skills';

export const skillProgressSchema = z.object({
  skill: z.enum(SKILL_CODES),
  level: z.number().int().min(1).max(10),
  action: z.enum(['complete', 'uncomplete']),
});
```

### 4.5 API-контракты

**GET `/api/skills`** — прогресс всех 6 навыков одним запросом.
- Auth: `requireAuth()` (паттерн эталона). userId = `user.sub`.
- Логика: `prisma.skillProgress.findMany({ where: { userId: user.sub }, select: { skill, completedLevel } })`, затем смёрджить в полный объект по всем `SKILL_CODES` с дефолтом 0.
- Ответ 200:
```jsonc
{ "progress": { "speaking": 0, "reading": 0, "listening": 0, "writing": 0, "vocabulary": 0, "grammar": 0 } }
```
- Ошибки: 401 (нет сессии).

**POST `/api/skills/progress`** — завершить/откатить уровень.
- Auth: `requireAuth()`. userId = `user.sub` (НЕ из тела).
- Тело: `{ skill, level, action }`, валидировать `skillProgressSchema.safeParse(body)`; невалидно → `jsonError(400, ...)`.
- Атомарное применение (гонко-безопасно, без read-then-write на запись):

```ts
// прочитать текущее только для расчёта ожидаемого предыдущего значения не нужно —
// используем условный updateMany по ожидаемому предыдущему уровню.
if (action === 'complete') {
  const prev = level - 1; // 0..9
  const res = await prisma.skillProgress.updateMany({
    where: { userId: user.sub, skill, completedLevel: prev },
    data: { completedLevel: level },
  });
  if (res.count === 1) return ok(level);
  // строки нет (первое прохождение навыка) — создать только если это уровень 1
  if (prev === 0) {
    try {
      await prisma.skillProgress.create({ data: { userId: user.sub, skill, completedLevel: level } });
      return ok(level);
    } catch { /* unique-нарушение => строка уже есть, значит нарушена последовательность */ }
  }
  return jsonError(409, 'Levels must be completed in order');
}

if (action === 'uncomplete') {
  const res = await prisma.skillProgress.updateMany({
    where: { userId: user.sub, skill, completedLevel: level }, // откатить можно только текущий верх
    data: { completedLevel: level - 1 },
  });
  if (res.count === 1) return ok(level - 1);
  return jsonError(409, 'You can only undo your current level');
}
```
где `ok(newLevel)` → `NextResponse.json({ skill, completedLevel: newLevel })`.
- Почему так: условный `updateMany where completedLevel = prev` + уникальный индекс на `create` делают операцию атомарной на уровне БД. Повтор того же `complete` (двойной клик/ретрай) не находит строку с `completedLevel = prev` (она уже `= level`) → 409, второй инкремент не происходит. Две параллельные заявки на один уровень: одна выиграет UPDATE (count 1), вторая получит count 0 → 409. Значение задаётся абсолютно (`completedLevel = level`), а не инкрементом, поэтому даже гонки не «перепрыгивают» уровень.
- Ошибки: 400 (валидация), 401 (нет сессии), 409 (нарушена последовательность).

### 4.6 Тексты UI и контент уровней (English — всё в приложении на английском)

Статические тексты страниц:
- Nav label: `Skills`
- Обзор, заголовок: `Skills` ; подзаголовок: `Six skills, ten levels each. Complete them in order.`
- Карточка навыка, прогресс: `Level {n} of 10` (при 0 → `Not started`); кнопка/ссылка ведёт в навык (вся карточка кликабельна).
- Лестница, кнопка peek: `Peek ahead` / `Hide upcoming`
- Текущий уровень, кнопка: `Mark as complete` (в pending → `Saving…`, disabled)
- Completed-уровень (только текущий верх), действие отката: `Mark as not done`
- Заблокированный уровень (текст скрыт): `Locked` + иконка замка (`Lock`), `aria-label="Locked — complete previous levels first"`
- Тосты: успех complete → `{Skill} · Level {n} complete` ; успех uncomplete → `{Skill} · Level {n} reopened` ; ошибка → `Couldn’t save — try again`
- Ошибка загрузки (обзор): `Couldn’t load your skills` (ErrorMessage с retry = refetch)
- Невалидный навык в URL: `Unknown skill` + ссылка `Back to skills`

Контент уровней (в `SKILLS[...].levels`, индекс 0 = уровень 1), дословно:

**speaking**
1. `A few sentences about myself (name, where I'm from, what I do)`
2. `Greetings, goodbyes, thanks, simple questions`
3. `Handle everyday situations: order food, buy things, ask for directions`
4. `Talk about my day/plans in 5–10 sentences`
5. `Hold small talk for 2–3 minutes`
6. `Explain a problem and ask for help (hotel, doctor, service)`
7. `Tell a real-life story that people understand`
8. `Argue and explain my opinion, even with mistakes`
9. `Talk 15+ minutes without switching to my native language`
10. `Freedom: talk to anyone about anything — with plenty of mistakes, but I talk and I'm not afraid`

**reading**
1. `Read single words, signs, names`
2. `Understand short messages, menus, captions`
3. `Read graded texts for beginners`
4. `Read comics/manga and get the point`
5. `Catch the main idea of an article on a familiar topic`
6. `Read posts and forums, rarely need a dictionary`
7. `Finished my first simple book`
8. `Read articles in my field with ease`
9. `Read a regular book — don't know every word, but never lose the plot`
10. `Freedom: read books for pleasure — no translating in my head, just reading and enjoying`

**listening**
1. `Catch familiar words in slow speech`
2. `Understand simple phrases spoken clearly`
3. `Understand podcasts/videos for beginners`
4. `Watch familiar anime/shows with English subs`
5. `Understand YouTube on familiar topics with subs`
6. `Understand learner podcasts without subs`
7. `Shows with English subs, almost no pausing`
8. `Regular YouTube without subs: main idea + details`
9. `Fast natural speech, accents, movies without subs`
10. `Freedom: listen to anything and just understand, no effort`

**writing**
1. `2–3 sentences about myself`
2. `A short chat message`
3. `Simple back-and-forth messaging`
4. `A social media post or comment`
5. `A template-based email (request, complaint)`
6. `Describe an event/story in a paragraph or two`
7. `Work correspondence with clients`
8. `Long structured text (review, guide, article)`
9. `Write fast and naturally, mistakes don't block understanding`
10. `Freedom: write anything to anyone without fear or a translator`

**vocabulary**
1. `~100 survival words`
2. `~300: daily life, food, family, work`
3. `~600: describe any everyday thing in simple words`
4. `~1,000: understand most everyday speech`
5. `~2,000: stop translating every word in my head`
6. `Phrasal verbs and basic idioms`
7. `~3,000+: shows and posts without a dictionary`
8. `Vocabulary of my field — talk about my work freely`
9. `~5,000+: say the same thing in different ways, feel the nuances`
10. `Freedom: don't know a word → explain it with other words, and it's no problem at all`

**grammar**
1. `Build a simple sentence: I am / I have / I like`
2. `Present Simple: routines, questions, negatives`
3. `Past: tell what happened`
4. `Future: plans and promises (will / going to)`
5. `Continuous and how it differs from Simple`
6. `Present Perfect vs Past Simple (the big wall — cleared)`
7. `Modal verbs, conditionals 0–2`
8. `Passive voice, reported speech, conditional 3`
9. `Feel the right tense without recalling the rule`
10. `Freedom: grammar on autopilot — rare mistakes don't get in the way`

### 4.7 Типы (добавить в `src/types/index.ts`, C0)

```ts
import type { SkillCode } from '@/lib/skills'; // либо продублировать union — но лучше импорт
export type SkillsResponse = { progress: Record<SkillCode, number> };
export interface SkillProgressUpdate { skill: SkillCode; completedLevel: number; }
```
Примечание: чтобы не плодить круговых импортов, `SkillCode` живёт в `skills.ts`; `types/index.ts` его импортирует. Это ок (skills.ts не импортирует types).

## 5. Frontend: данные, компоненты, лейаут

### 5.1 Слой данных `src/lib/queries/skills.ts` (C2)
```ts
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { SkillsResponse } from '@/types';

export const skillKeys = { all: ['skills'] as const };

export const skillsOptions = queryOptions({
  queryKey: skillKeys.all,
  queryFn: () => fetchApi<SkillsResponse>('/api/skills'),
});
```

### 5.2 Хук `src/hooks/use-skills.ts` (C2)
- `useSkills()` → `useQuery(skillsOptions)`.
- `useSkillMutation()` → `useMutation`:
  - `mutationFn(v: { skill: SkillCode; level: number; action: 'complete'|'uncomplete' })` → `fetchApi<SkillProgressUpdate>('/api/skills/progress', { method:'POST', body: JSON.stringify(v) })`.
  - **Оптимистично** (реакция ≤200мс): `onMutate` — `cancelQueries(skillKeys.all)`, снять snapshot, локально выставить `progress[skill] = action==='complete' ? level : level-1`.
  - `onError` — откатить snapshot + `toast({ type:'error', title:'Couldn’t save — try again' })`.
  - `onSuccess` — `toast` успех (тексты §4.6).
  - `onSettled` — `invalidateQueries(skillKeys.all)`.
  - `useToast` из `@/components/ui/Toast`, `useQueryClient` из TanStack.

### 5.3 Метаданные отображения `src/components/skills/skill-meta.ts` (C2)
Иконки и цвет на код навыка (переиспользуем duo-палитру). Импорт из `lucide-react` (в проекте есть; если какого-то имени нет в установленной версии — заменить на близкое существующее, проверить импортом):
```ts
import { Mic, BookOpen, Headphones, PenLine, Library, GraduationCap, type LucideIcon } from 'lucide-react';
import type { SkillCode } from '@/lib/skills';

export const SKILL_META: Record<SkillCode, { Icon: LucideIcon; accent: string; nodeClass: string }> = {
  speaking:   { Icon: Mic,           accent: 'var(--duo-green)',  nodeClass: 'duo-node--green'  },
  reading:    { Icon: BookOpen,      accent: 'var(--duo-blue)',   nodeClass: 'duo-node--blue'   },
  listening:  { Icon: Headphones,    accent: 'var(--duo-purple)', nodeClass: 'duo-node--purple' },
  writing:    { Icon: PenLine,       accent: 'var(--duo-orange)', nodeClass: 'duo-node--orange' },
  vocabulary: { Icon: Library,       accent: 'var(--duo-gold)',   nodeClass: 'duo-node--gold'   },
  grammar:    { Icon: GraduationCap, accent: 'var(--duo-red)',    nodeClass: 'duo-node--purple' },
};
```
(nodeClass для grammar — любой существующий вариант с тенью; цвет задаём через inline accent. Главное — не изобретать новых глобальных классов, переиспользовать существующие карточки/кнопки.)

### 5.4 Обзор `src/app/(protected)/skills/page.tsx` (C2, `'use client'`)
- `useSkills()`. `isPending` → `<LoadingSpinner/>`; `isError` → `<ErrorMessage message="Couldn’t load your skills" onRetry={refetch}/>`.
- Заголовок (`font-display`, как в приложении) + подзаголовок.
- Сетка карточек: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (1 / 2 / 3 колонки).
- Каждая карточка — `<SkillCard code progress={progress[code]} />`, обёрнута в `<Link href={`/skills/${code}`}>`.

### 5.5 `src/components/skills/SkillCard.tsx` (C2)
Props: `{ code: SkillCode; progress: number }`. Внутри:
- Класс карточки `premium-card`/`airy-card` (существующие: `border-2`, `rounded-2xl`, `padding`).
- Строка: иконка (в кружке с accent, как в Toast) + `SKILLS[code].name` (`font-display`, font-extrabold).
- Прогресс текст: `progress === 0 ? 'Not started' : `Level ${progress} of 10``.
- Прогресс-бар: контейнер `w-full` `h-3 rounded-full` фон `var(--rule)`, заливка ширина `${progress*10}%` цвет accent, `overflow-hidden` — заливка не выходит за пределы (bug-ban «overflow»).
- Тизер текущего уровня: если `progress < 10` — одна строка `skillLevelText(code, progress+1)` приглушённым цветом (`var(--ink-muted)`), `line-clamp` НЕ обязателен, но допускается 2 строки; если `progress === 10` — `All levels complete 🎉` (без стоковых эмодзи в заголовках — тут это статус-строка, допустимо, либо просто `All levels complete`).
- Вся карточка ≥44px по высоте очевидно; hover — лёгкий `--surface-hover`.

### 5.6 Лестница `src/app/(protected)/skills/[skill]/page.tsx` (C2, `'use client'`)
- `const { skill } = useParams<{ skill: string }>()` (клиентский компонент — параметры через `useParams`, НЕ async-проп).
- Валидация: `if (!isSkillCode(skill)) return <ErrorMessage message="Unknown skill"/>` + ссылка `Back to skills` (`<Link href="/skills">`).
- `useSkills()` для прогресса; `useSkillMutation()` для действий.
- Локальный стейт `peek: boolean` (по умолчанию false).
- Рендер `<SkillLadder code={skill} completedLevel={progress[skill]} peek={peek} onTogglePeek={...} mutation={...} />` (или всё инлайн — на усмотрение, но держать компонент чистым).
- loading/error — как на обзоре.

### 5.7 `src/components/skills/SkillLadder.tsx` (C2)
Props: `{ code: SkillCode; completedLevel: number; peek: boolean; onTogglePeek: () => void; onComplete: (level:number)=>void; onUncomplete: (level:number)=>void; pendingLevel: number | null }`.
- Верх: заголовок навыка (иконка + имя + `Level {completedLevel} of 10`), справа кнопка peek: класс `button-ghost`, текст `Peek ahead`/`Hide upcoming`, `aria-pressed={peek}`.
- Список — семантический `<ol>` (порядковый), каждый уровень `<li>` карточкой. Для уровня `n` (1..10) вычислить статус:
  - `completed`  = `n <= completedLevel`
  - `current`    = `n === completedLevel + 1`
  - `locked`     = `n > completedLevel + 1`
- Разметка строки уровня (вертикальная карточка, чтобы на 375px ничего не сжималось):
  - Верхняя строка: бейдж-номер (кружок, accent для completed/current, серый для locked; для completed — иконка `Check`) + статус-иконка справа (`Check` completed / `Lock` locked / ничего для current).
  - Текст условия:
    - `completed` и `current` — всегда виден: `skillLevelText(code, n)`.
    - `locked` — виден ТОЛЬКО если `peek === true`; иначе строка `Locked` + `Lock` (aria-label «Locked — complete previous levels first»), сам текст не рендерится.
  - Строка действия (отдельной строкой снизу, full-width на узком — не втискивать сбоку):
    - `current` → кнопка `Mark as complete` (`button-primary`), `disabled={pendingLevel === n}`, в pending текст `Saving…`; `onClick={() => onComplete(n)}`.
    - `completed && n === completedLevel` (только самый верхний пройденный) → кнопка отката `Mark as not done` (`button-ghost`), `disabled={pendingLevel === n}`; `onClick={() => onUncomplete(n)}`.
    - `locked` → действий нет; вся карточка `aria-disabled`, приглушена (`opacity` ~0.6), `cursor-default`, НЕ кликабельна для прохождения.
- Ширина колонки чтения: обернуть в `max-w-2xl mx-auto`, чтобы длинные условия читались комфортно на 1440.

### 5.8 Навигация `src/components/layout/AppLayout.tsx` (C2, точечная правка)
Добавить в массив `NAV_ITEMS` второй элемент и импорт иконки:
```ts
import { Layers, Trophy } from 'lucide-react';
const NAV_ITEMS = [
  { href: '/decks',  label: 'Learn',  Icon: Layers },
  { href: '/skills', label: 'Skills', Icon: Trophy },
];
```
Больше в этом файле НИЧЕГО не менять. `isActive` уже покрывает `/skills` и `/skills/xxx` (startsWith). На <1024 таббар станет из двух вкладок — существующий `flex`/`flex-1` это держит.

## 6. Лейаут на 375 / 768 / 1440

- **Контейнер** даёт `AppLayout` (`max-w-5xl`, боковые паддинги, `main pb-24 lg:pb-0`). Наши страницы НЕ добавляют своих fixed/sticky-зон → контент не попадёт под нижний таббар (кнопки «Mark complete» инлайновые, не прилипшие). Это осознанное решение против бага «контент под fixed».
- **Обзор:** 375 — 1 колонка карточек; 768 — 2 (`sm:grid-cols-2`); 1440 — 3 (`lg:grid-cols-3`). Карточка: иконка+имя в строку, прогресс-бар на всю ширину, тизер в 1–2 строки. Прогресс-бар `overflow-hidden`, заливка ≤100%.
- **Лестница:** всегда одна колонка, `max-w-2xl` по центру. Строка уровня — вертикальная карточка: (номер+статус) сверху, текст, действие снизу full-width. На 375 кнопка не сжимается (она в своей строке). Peek-кнопка в шапке: на 375 уходит под заголовок (шапка `flex-wrap` или `flex-col sm:flex-row`), не наезжает на `Level X of 10`.
- Нет элементов, завязанных на фикс-ширину; длинные тексты переносятся (`break-words`/обычный wrap), не обрезаются.
- Интерактив ≥44px: `button-primary`/`button-ghost` имеют `min-height:48px`; кликабельная карточка навыка заметно выше 44px.

## 7. Гейт всей фичи (прогнать после C1+C2, до сдачи руководителю)

Порядок (из корня проекта):
1. `pnpm prisma:migrate` — применить аддитивную миграцию (создать `skill_progress`). Затем `pnpm prisma:generate` если клиент не пересобран (в `build` он есть).
2. `pnpm build` — `prisma generate` + `next build` без ошибок типов (0 `any`).
3. `pnpm lint` — чисто.
4. `pnpm test` — включая новый `tests/unit/skills-progress.test.ts` (тесты `nextCompletedLevel`: complete только `+1`, uncomplete только текущего, границы 0/10, невалидный level → null).
5. Смоук вручную (dev-сессия под залогиненным юзером):
   - `GET /api/skills` → 200, `progress` со всеми 6 кодами (нули на чистом юзере).
   - `POST /api/skills/progress {skill:'speaking', level:1, action:'complete'}` → 200 `{completedLevel:1}`.
   - Повтор того же запроса → **409** (защита от двойного клика, прогресс не 2).
   - `POST {skill:'speaking', level:3, action:'complete'}` (перепрыгнуть) → **409**.
   - `POST {skill:'speaking', level:1, action:'uncomplete'}` → 200 `{completedLevel:0}`.
   - `POST` без сессии → **401**. Битое тело (`skill:'foo'`) → **400**.
   - UI: `/skills` показывает 6 карточек; вход в навык; текущий уровень с текстом и кнопкой; будущие скрыты; «Peek ahead» раскрывает; «Mark as complete» двигает прогресс с тостом; «Mark as not done» откатывает.

## 8. Разбивка на куски (непересекающиеся по файлам)

Порядок: **C0** первым (общий контракт), затем **C1** и **C2** параллельно (они не делят файлы; C2 при билд-верификации опирается на типы/skills.ts из C0, рантайм-смоук — на C1, поэтому финальный смоук на гейте). Все исполнители — **Sonnet**.

### Кусок C0 — Общий контракт и контент (Sonnet, первым)
Файлы (владелец — только C0):
- `src/lib/skills.ts` (новый) — §4.3 целиком, все 60 текстов §4.6, функции `isSkillCode`, `skillLevelText`, `nextCompletedLevel`.
- `src/types/index.ts` (правка) — добавить `SkillsResponse`, `SkillProgressUpdate` (§4.7). Существующие типы не трогать.
Готово, когда: `pnpm build` (typecheck) и `pnpm lint` зелёные; массивы `levels` длиной 10; экспортируемые имена совпадают с контрактом.
Проверка: `pnpm build && pnpm lint`.

### Кусок C1 — Backend (Sonnet, после C0)
Файлы (владелец — только C1):
- `prisma/schema.prisma` (правка) — модель `SkillProgress` + строка связи в `User` (§4.1).
- `prisma/migrations/<ts>_add_skill_progress/migration.sql` (новый) — §4.2.
- `src/lib/validations.ts` (правка) — `skillProgressSchema` (§4.4).
- `src/app/api/skills/route.ts` (новый) — GET (§4.5).
- `src/app/api/skills/progress/route.ts` (новый) — POST (§4.5), атомарная логика.
- `tests/unit/skills-progress.test.ts` (новый) — юнит-тесты `nextCompletedLevel`.
Готово, когда: миграция применяется на чистой БД, `GET`/`POST` отвечают по контракту (в т.ч. 400/401/409), тесты проходят, авторизация берёт userId из сессии.
Проверка: `pnpm prisma:migrate` (на dev/local) + `pnpm test` + ручной смоук эндпоинтов (§7 п.5) + `pnpm build`.

### Кусок C2 — Frontend (Sonnet, после C0, параллельно с C1)
Файлы (владелец — только C2):
- `src/lib/queries/skills.ts` (новый) — §5.1.
- `src/hooks/use-skills.ts` (новый) — §5.2.
- `src/components/skills/skill-meta.ts` (новый) — §5.3.
- `src/components/skills/SkillCard.tsx` (новый) — §5.5.
- `src/components/skills/SkillLadder.tsx` (новый) — §5.7.
- `src/app/(protected)/skills/page.tsx` (новый) — §5.4.
- `src/app/(protected)/skills/[skill]/page.tsx` (новый) — §5.6.
- `src/components/layout/AppLayout.tsx` (правка) — только пункт навигации (§5.8).
Готово, когда: обе страницы рендерят все состояния (loading/error/invalid-param), лестница реализует completed/current/locked+peek, мутации оптимистичны с тостом и откатом, лейаут ок на 375/768/1440.
Проверка: `pnpm build && pnpm lint`; визуально пройти сценарий UI (§7 п.5) — при готовом C1 или на моке ответа.

## 9. Запреты для исполнителей (обязательно соблюдать)

- НЕ трогать файлы вне своего куска (параллельная работа в одном дереве). Нужен baseline чужого файла — `git show HEAD:<файл>`.
- НЕ менять существующие контракты/типы/эндпоинты/схему вне описанного здесь. Контракты §4 — фиксированы; нужно изменить — стоп, вернуть на ревью, не править молча.
- НЕ трогать спеку `specs/011-skill-map-canvas` и маршрут `/map` — это ДРУГАЯ, нереализованная фича. Наш маршрут — `/skills`.
- ЗАПРЕЩЕНЫ `git stash`, `git reset`, `git checkout .`, `git clean` и любые деструктивные git-операции в общем дереве.
- ЗАПРЕЩЕНЫ любые операции с рабочей (прод/Neon) БД, кроме применения аддитивной миграции из §4.2 через `pnpm prisma:migrate`. Никаких `migrate reset`, `DROP`, ручных правок данных.
- Новых npm-зависимостей НЕ добавлять. Новых глобальных CSS-классов не плодить — переиспользовать существующие (`premium-card`, `button-primary`, `button-ghost`, `btn-3d`, `nav-*`, duo-переменные).
- 0 `any`, без `dangerouslySetInnerHTML`, все внешние тексты — из §4.6.

## 10. Что добавили скиллы-ревьюеры (сверх исходных рекомендаций лида)

Прогнано: `vercel-plugin:nextjs`, `vercel-plugin:react-best-practices`, security-проход, «Запреты backend-багов», `frontend-ui-design-reviewer`.

- **frontend-ui-design-reviewer (UI-баги):** (1) кнопки «complete» инлайновые, не под нижним фикс-таббаром (осознанно без sticky CTA); (2) прогресс-бар `overflow-hidden`, заливка ≤100% — нет вылезания; (3) заблокированные уровни явно НЕинтерактивны (`aria-disabled`, opacity, cursor) и не проходятся вне очереди; (4) никаких голых нативных контролов — только существующие классы кнопок; (5) ни одного молчаливого действия — тост + оптимистика + pending-disable на каждое; (6) peek — инлайн-раскрытие, не обрезаемый поповер; (7) длинные условия переносятся, не обрезаются; (8) шапка лестницы `flex-wrap`/`flex-col` — peek не наезжает на прогресс; (9) сетка обзора 1/2/3 колонки без горизонтального скролла.
- **react-best-practices / nextjs:** (10) параметр `[skill]` через `useParams()` в клиентском компоненте (не async-проп params); (11) валидация param по `isSkillCode` до рендера; (12) мутация с `onMutate/onError` rollback + `onSettled invalidate`; (13) корректные `'use client'` границы; (14) стабильные ключи списков (код/номер уровня); (15) 0 `any`.
- **security / backend-bug-bans:** (16) userId только из сессии (`user.sub`), никогда из тела — на обоих эндпоинтах; (17) zod-валидация тела на границе POST; (18) гонко-безопасность и идемпотентность через атомарный условный `updateMany` + уникальный индекс на `create` — двойной клик/ретрай не даёт двойного инкремента (→409); (19) уникальный индекс `(user_id, skill)` покрывает выборку и апсерт — без N+1 (GET — один `findMany`); (20) откат миграции задокументирован, миграция аддитивна; (21) матрица авторизации: оба эндпоинта — только свой прогресс (ключ по `user.sub`), кросс-юзер доступ невозможен; (22) FK `ON DELETE CASCADE` — прогресс чистится вместе с юзером.
```
