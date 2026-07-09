# План — Мини-ревизия: единственная колода «Vocabulary»

**Спека:** `~/dev/second-brain/studio/shared/specs/2026-07-09-anki-like-single-vocabulary-deck.md`
**Тип:** мини-ревизия (полная церемония не проводится). Стек: Next.js 15 App Router, Prisma 6 → Neon, TanStack Query v5.

## Суть фикса
Приложение должно вести себя как одноколодное. Убираем создание и удаление колод (UI + API), `/decks` больше не показывает список — редиректит сразу в единственную колоду. Существующую колоду руководителя переименовываем в `Vocabulary` одним `UPDATE` поля имени, не трогая карточки/состояния/логи/статистику. Схему Prisma и миграции НЕ трогаем.

## Затронутые файлы / эндпоинты
- `src/app/(protected)/decks/page.tsx` — из «learning path» списка делаем тонкий редиректор в единственную колоду.
- `src/app/(protected)/decks/[id]/page.tsx` — убрать UI удаления колоды и ссылку «Back to path».
- `src/app/api/decks/route.ts` — удалить `POST` (создание). `GET` оставить.
- `src/app/api/decks/[id]/route.ts` — удалить `DELETE`. `GET` и `PATCH` оставить.
- `src/lib/validations.ts` — удалить осиротевший `createDeckSchema` (`updateDeckSchema` оставить).
- `scripts/rename-deck-to-vocabulary.mjs` — новый одноразовый гейт-скрипт переименования (dry-run по умолчанию).
- НЕ трогаем: `src/lib/queries/decks.ts` (read-хуки нужны редиректору), `review/[deckId]`, Prisma-схему, `CreateDeckDialog.tsx` (станет неиспользуемым — только упомянуть, файл не удалять).

## Решение по маршруту «сразу в колоду»
**Клиентский редирект внутри существующего `decks/page.tsx`** (не серверный, не рендер детали напрямую): переиспользуем уже работающий клиентский query `deckListInfiniteOptions` (тот же путь auth/fetch, что работает сейчас) и делаем `router.replace('/decks/'+id)`. Серверный редирект отклонён: layout аутентифицируется через Clerk, а API — через `requireAuth`/JWT `sub`; связь между Clerk-userId и `deck.userId` неочевидна, серверный Prisma-запрос по userId — это риск/догадка, недопустимая в мини-ревизии. Клиентский редирект ничего в auth-модели не трогает.

## Куски исполнения

### Кусок A — Frontend (2 файла, не пересекаются с B/C)
**A1. `src/app/(protected)/decks/page.tsx` → редиректор.**
- Выкинуть всю «learning path» машинерию: `VARIANTS`, `RING_COLOR`, `NODE_ICONS`, `OFFSETS`, `Ring`, `createDeck`-мутацию, `handleCreate`, `showCreate`, `CreateDeckDialog` (и его import), «New deck» узел, sentinel/infinite-подгрузку, mascot-хедер.
- Оставить: загрузка колод через `deckListInfiniteOptions` → `const decks = data?.pages.flatMap(p => p.items) ?? []`.
- Поведение:
  - `isPending` → `<LoadingSpinner />` (фидбек присутствует).
  - `isError` → `<ErrorMessage message=... />` (как сейчас).
  - success, `decks.length >= 1` → в `useEffect` `router.replace('/decks/' + decks[0].id)`; пока идёт — показывать `<LoadingSpinner />`.
  - success, `decks.length === 0` → показать явное сообщение (`<ErrorMessage message="No deck found" />` или EmptyState) — **не молчаливый бесконечный спиннер** (создания колоды больше нет, тупик недопустим). Это состояние аварийное (после переименования инвариант = ровно 1 колода), но обязано давать обратную связь.
- Убрать все ставшие неиспользуемыми import'ы (lucide-иконки узлов, `useMutation`, `useQueryClient`, `useToast`, `CreateDeckDialog`, `Deck` если больше не нужен). `pnpm build` поймает висящие импорты.
- Критерий: файл сжат до загрузка→редирект; сборка зелёная; `/decks` мгновенно уводит в `/decks/[id]`.

**A2. `src/app/(protected)/decks/[id]/page.tsx` — убрать удаление колоды + «Back to path».**
- Удалить: `deleteDeck`-мутацию (стрелка на `/decks`), состояние `deletingDeck`, кнопку-Trash2 удаления колоды в хедере (блок с `setDeletingDeck(true)`), `ConfirmDialog` для `deletingDeck`.
- Удалить ссылку «Back to path» (`<Link href="/decks" ...>` с `ArrowLeft`) — концепции «список/path» больше нет, а этот линк создавал бы петлю `/decks → redirect → та же колода`.
- Осиротевшие import'ы после этого: `Link` (next/link) и `ArrowLeft` (lucide) — удалить. **НЕ удалять** `Trash2` (используется в удалении карточки), `ConfirmDialog` (используется для удаления карточки), `useRouter` (используется для `/review/${id}`).
- **Сохраняем** rename колоды (карандаш/`editingName`, PATCH) — вне области «create/delete», безвреден.
- Критерий: удалить колоду из UI нельзя; ревью/добавление/редактирование/лимиты/статистика не тронуты; сборка зелёная.

### Кусок B — API + validations (3 файла, независимы от A и C)
**B1. `src/app/api/decks/route.ts`** — удалить `export async function POST`. Оставить `GET`. Удалить осиротевший `import { createDeckSchema }`. Проверить, что `NextRequest/NextResponse/prisma/requireAuth/getNow/countDueForReview/TokenPayload` ещё используются `GET` (используются) — не трогать.
**B2. `src/app/api/decks/[id]/route.ts`** — удалить `export async function DELETE`. Оставить `GET` и `PATCH`. Удалить осиротевший `import type { Prisma }` (использовался только в DELETE-транзакции). Остальные импорты нужны GET/PATCH.
**B3. `src/lib/validations.ts`** — удалить блок `createDeckSchema` (единственный потребитель был POST; grep подтверждает). Оставить `updateDeckSchema` и прочее.
- Авторизация: у оставшихся `GET`/`PATCH` первым идёт `requireAuth` — удаление POST/DELETE новых незащищённых эндпоинтов не создаёт.
- Критерий: `POST /api/decks` и `DELETE /api/decks/[id]` больше не существуют; `pnpm build` + typecheck зелёные; нет висящих импортов.

### Кусок C — Данные: переименование колоды (ОПАСНО, прод Neon, гейт)
**C1. `scripts/rename-deck-to-vocabulary.mjs`** (по образцу `scripts/reset-onboarding.mjs`, `PrismaClient` из `@prisma/client`, запуск `node scripts/...`):
- Считать `count` колод с `deletedAt: null`.
- Вывести count + `id`/`name` найденных колод.
- Если `count !== 1` → напечатать «STOP: ожидалась ровно 1 колода, найдено N», **ничего не менять**, выйти с ненулевым кодом.
- Если `count === 1`:
  - dry-run по умолчанию: напечатать «Would rename "<текущее>" → "Vocabulary"», НЕ писать.
  - только при флаге `--apply`: `prisma.deck.update({ where: { id }, data: { name: 'Vocabulary' } })` — **исключительно поле `name`**. Напечатать подтверждение.
- Никаких `DELETE`/`DROP`/`TRUNCATE`/`updateMany`/операций над `card`/`cardState`/`reviewLog`/счётчиками. Только один `update` одного поля.
- Ошибки не глотать: любой сбой → `throw`/ненулевой выход + сообщение. `finally { await prisma.$disconnect() }`.
- Имя: `Vocabulary` (заглавная V — из спеки; допущение зафиксировано).

**Гейт запуска C (для исполнителя):** скрипт бьёт по прод-БД Neon. Это `UPDATE` по непустой БД → по правилам фазы B требует явного «да» руководителя/лида ПЕРЕД запуском с `--apply`. Порядок: (1) прогнать dry-run, показать вывод (ровно 1 колода, текущее имя); (2) получить явное подтверждение; (3) запустить `--apply`; (4) проверить в UI, что хедер колоды показывает «Vocabulary», карточки/статистика на месте.

## Порядок и зависимости
- A, B, C не пересекаются по файлам — можно параллельно. Рекомендуемый порядок: C.dry-run (подтвердить инвариант «1 колода») → A и B → C.apply (после явного «да») → финальная проверка.

## Гейт готовности
1. `pnpm build` зелёный (ловит висящие импорты/типы).
2. `pnpm test` зелёный (тестов на deck POST/DELETE нет — не сломаем; убедиться прогоном).
3. Ручной флоу: открыть приложение → сразу попадаем в колоду (не в список) → её имя «Vocabulary» → «Start review» проходит карточку → «Add card» добавляет карточку. Создать/удалить колоду в UI негде.
4. Данные: карточки, дневные лимиты, «reviewed/added today», статистика — визуально без изменений после переименования.

## Прогон по чеклистам (что добавила проверка)
- **frontend-ui-design-reviewer (релевантные классы):** +1 явный пункт — обработать `decks.length === 0` в редиректоре видимым сообщением, чтобы не было молчаливого бесконечного спиннера (нет молчаливых тупиков). Классы «наезд/fixed-зоны/тосты/нативные контролы» неприменимы (лейаут не добавляем, только удаляем).
- **Запреты backend-багов (релевантные):** (1) молчаливое проглатывание — rename-скрипт обязан бросать/падать с сообщением, не глотать. (5) эндпоинт без авторизации — подтверждено: оставшиеся GET/PATCH начинаются с `requireAuth`, удаление POST/DELETE незащищённых эндпоинтов не создаёт. Плюс data-safety гейт для C (count-check + dry-run + только поле name + запрет DELETE/DROP/TRUNCATE и операций над cards/states/logs).
```
