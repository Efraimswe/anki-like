# План — Мини-ревизия фронтенда, вторая волна: тексты «Deck» → «Vocabulary»

**Спека:** `studio/shared/specs/2026-07-09-anki-like-single-vocabulary-deck.md` §D3
**Тип:** мини-ревизия (ужатый план, только замена пользовательских строк, без изменения структуры/поведения/логики).
**Проект:** `~/dev/anki-like` (Next.js 15 App Router, TanStack Query v5, Tailwind 4). Приложение одноязычное английское — все тексты по-английски.

## Что уже в порядке (НЕ трогать — проверено чтением)

- **Навигация** (`src/components/layout/AppLayout.tsx`): пункт меню уже `label: 'Learn'`, wordmark — `Lexa`. Слова «Deck(s)» в навбаре нет → менять нечего, риска для навбара на 375px нет.
- **Заголовок страницы колоды** (`decks/[id]/page.tsx:193`): `<h1>{deck!.name}</h1>` — уже берётся из данных, показывает «Vocabulary». Оставить как есть (спека: имя из данных, не хардкод).
- **Metadata title** (`src/app/layout.tsx:15`): `'Lexa — learn with flashcards'` — «Deck» нет. Не трогать.
- **Review-страница** (`review/[deckId]/page.tsx`): видимого текста с «deck» нет. Не трогать.

## Границы (D4 — НЕ ТРОГАЕМ)

- Идентификаторы кода: тип `Deck`, `DeckWithCards`, `deckId`, роут `/decks`, `deckKeys`, мутация `updateDeck`, `deckListInfiniteOptions`, aria/строки про **card** («Edit card», «Delete card», «Card added») — это про карточки, не колоду.
- API-строки (`src/app/api/**`, напр. `jsonError(404, 'Deck not found')`) — это бэкенд (§D2), НЕ фронтенд-зона. В этой ревизии не трогаем.
- `src/components/ui/CreateDeckDialog.tsx` — **осиротевший файл** (первой волной оставлен намеренно, нигде не рендерится). Его строки («Create deck», `create-deck-title`) пользователю не видны → не меняем и не удаляем. Учтено в гейте (исключается из grep).

## Инвентарь видимых строк к замене (файл:строка → старое → новое)

| # | Файл:строка | Старое (видимое) | Новое |
|---|---|---|---|
| 1 | `src/app/(protected)/decks/[id]/page.tsx:165` | `'Failed to load deck'` | `'Failed to load your vocabulary'` |
| 2 | `src/app/(protected)/decks/[id]/page.tsx:166` | `"Deck not found"` | `"Vocabulary not found"` |
| 3 | `src/app/(protected)/decks/[id]/page.tsx:197` | `aria-label="Rename deck"` | `aria-label="Rename vocabulary"` |
| 4 | `src/app/(protected)/decks/page.tsx:23` | `'Failed to load deck'` | `'Failed to load your vocabulary'` |
| 5 | `src/app/(protected)/decks/page.tsx:29` | `"No deck found"` | `"No vocabulary found"` |
| 6 | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx:20` | `Bite-size decks, smart spaced-repetition review, and a friendly owl cheering you on.` | `Bite-size lessons, smart spaced-repetition review, and a friendly owl cheering you on.` |
| 7 | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx:19` | `Build decks, review daily, and remember more with every session.` | `Build your vocabulary, review daily, and remember more with every session.` |

**Обоснование формулировок:** «Rename deck» — единственная колода переименовываема (мутация `updateDeck` жива), поэтому в ошибках/лейблах используем родовое слово `vocabulary` (не хардкод конкретного имени «Vocabulary») — читается корректно, даже если пользователь переименует колоду. Строка №6: «decks» → «lessons» (единичная колода, множественное «decks» вводит в заблуждение). Строка №7: «Build decks» подразумевало создание колод (его больше нет) → «Build your vocabulary» — точнее и по-брендовому.

## Нарезка на независимые куски (непересекающиеся файлы, параллельно)

### Кусок 1 — Страница колоды (deck detail)
- **Файл:** `src/app/(protected)/decks/[id]/page.tsx`
- Заменить строки #1, #2, #3 из таблицы. Точечные string-replace, ничего вокруг не трогать.
- **Готово, когда:** три строки заменены; `grep -nE "load deck|Deck not found|Rename deck" src/app/\(protected\)/decks/\[id\]/page.tsx` пусто; `{deck!.name}` в h1 не тронут.

### Кусок 2 — Страница-редиректор (deck list → single)
- **Файл:** `src/app/(protected)/decks/page.tsx`
- Заменить строки #4, #5.
- **Готово, когда:** обе заменены; `grep -nE "load deck|No deck found" src/app/\(protected\)/decks/page.tsx` пусто; логика редиректа/загрузки не изменена.

### Кусок 3 — Маркетинговые тексты auth-страниц
- **Файлы:** `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Заменить строки #6, #7.
- **Готово, когда:** обе заменены; `grep -rniE "\bdecks\b" src/app/\(auth\)` пусто.

Куски 1/2/3 не пересекаются по файлам — можно исполнять параллельно тремя копиями.

## Проверка frontend-ui-design-reviewer (релевантные классы для чистых замен текста)

Прогнаны только релевантные классы (обрезка текста, молчаливые состояния). Добавлено в план **2 явных пункта**:

1. **Обрезка/переполнение изменённым текстом.** Новые строки длиннее старых («Vocabulary not found» 20 симв. vs «Deck not found» 14; «Build your vocabulary, …» длиннее «Build decks, …»). Проверено по коду: строки #1,#2,#4,#5 рендерятся в `ErrorMessage` (центрированный блок, перенос строк, без `truncate`/`nowrap`/фикс-ширины) → обрезки нет. Строки #6,#7 — в `<p className="mt-5 max-w-sm …">` с переносом → обрезки нет. **Исполнителю: не добавлять `truncate`/`whitespace-nowrap`; контейнеры не менять.** Навбар не затрагивается (пункт «Learn» без изменений) → проверка трёх ширин не требуется.
2. **Молчаливые состояния — неприменимо.** Новых действий/кнопок нет, контракт фидбека не меняется (свап только текста в уже существующих error/aria/маркетинг-строках). Тосты про карточки не трогаем.

## Гейт (после исполнения всех кусков)

1. **Сборка:** `pnpm build` — зелёная.
2. **Grep-гейт (в видимых текстах не осталось «Deck(s)»):**
   ```
   grep -rniE "\bdecks?\b" "src/app/(protected)" "src/app/(auth)"
   ```
   Ожидаемо остаются ТОЛЬКО идентификаторы/роуты (`deckKeys`, `deckListInfiniteOptions`, `DeckWithCards`, `type … Deck`, `deckId`, `/decks`, `/api/decks`) — не пользовательский текст. Пользовательских «deck»/«decks» быть не должно.
   Целевая быстрая проверка (должна быть пустой):
   ```
   grep -rnE "load deck|Deck not found|No deck found|Rename deck|Bite-size decks|Build decks" "src/app/(protected)" "src/app/(auth)"
   ```
   `CreateDeckDialog.tsx` (осиротевший, `src/components/ui/`) в гейт НЕ включаем — намеренно оставлен, пользователю не виден.
