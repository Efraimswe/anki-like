# План — Redesign SkillLadder → Duolingo-путь (Production frontend, вид 3)

Режим: редизайн ТОЛЬКО визуального слоя. Данные/API/хуки/контракты не трогаем.
Стек проекта: Next.js 15 + React 19 + Tailwind v4 + токены в `globals.css` (духовный «duo»-язык уже есть).

## Границы (жёстко)
- Правим: `src/components/skills/SkillLadder.tsx` (переписать разметку/визуал), `src/app/globals.css` (ДОБАВИТЬ секцию в конец, префикс `skill-path-` + keyframes `skill-*`).
- `src/app/(protected)/skills/[skill]/page.tsx` — НЕ меняем: пропсы `SkillLadder` остаются те же (`code, completedLevel, peek, onTogglePeek, onComplete, onUncomplete, pendingLevel`). Контракт компонента не трогаем.
- Новых npm-зависимостей нет. Анимации — только `transform`/`opacity` + box-shadow. Взрыв — CSS-частицы (spans) + кольцо-псевдоэлемент.
- Переиспользуем существующее: токены `--duo-*`, `--rule`, `--ink*`; классы `premium-card`, `button-primary`, `button-ghost`; `SKILL_META[code].accent` (per-skill акцент, инлайном как в текущем коде); утилита `color-mix(in srgb, …)` (уже применяется в файле).

---

## 1. Геометрия пути

Вертикальная колонка, узлы-кружки «плетутся» вокруг центральной пунктирной оси (спайн). Один узел = одна строка, переносов НЕТ по построению (по узлу на строку) → путь не может сломаться на wrap.

Разметка (скелет):
```tsx
<ol className="skill-path">                     {/* relative; ::before = центральный dashed-спайн */}
  {LEVELS.map((n) => {
    const side = n % 2 === 0 ? 'left' : 'right'; // чётные влево, нечётные вправо
    return (
      <li key={n} className="skill-path-row" data-side={side}>
        <div className="skill-path-node ..." style={{ '--accent': accent } as CSSProperties}>
          {/* контент кружка: галочка / номер / замок; burst-слой при взрыве */}
        </div>
        {/* caption: подпись/бабл/undo — ВСЕГДА по центру, без offset */}
      </li>
    );
  })}
</ol>
```

CSS (в globals.css):
```css
.skill-path { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; padding-bottom: 96px; }
/* центральная пунктирная ось за узлами */
.skill-path::before {
  content: ""; position: absolute; left: 50%; top: 12px; bottom: 96px;
  transform: translateX(-50%);
  border-left: 3px dashed var(--rule-strong);
  z-index: 0;
}
.skill-path-row { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
/* «плетение»: смещаем ТОЛЬКО кружок, подпись/бабл остаются центрированы */
.skill-path-row[data-side="left"]  .skill-path-node { transform: translateX(-var-offset); }
.skill-path-row[data-side="right"] .skill-path-node { transform: translateX(var-offset); }
```
Значения offset и диаметра (через media / clamp):
- **375px:** диаметр кружка **72px** (≥56 ✔), offset **±36px** → узел укладывается в 340px-колонку с запасом; спайн виден в зазорах, за кружком перекрыт непрозрачной заливкой → читается как соединение.
- **768/1440:** диаметр **84px** (как `duo-node-btn`), offset **±72px**. Контейнер — существующий `mx-auto max-w-2xl`.
- Реализация offset: задать CSS-переменную `--offset: 36px;` на `.skill-path`, на `@media (min-width:768px)` → `--offset: 72px;`; в правилах `translateX(calc(-1 * var(--offset)))` / `translateX(var(--offset))`. Диаметр так же через переменную `--node: 72px` / `84px`.
- Спайн центрирован, кружки непрозрачные → небольшой горизонтальный сдвиг узлов относительно прямой оси визуально сшивается краями кружков (кружок 72–84px перекрывает вход/выход линии). Диагональные коннекторы НЕ рисуем — проще и надёжнее (нет тригонометрии, ничего не разъезжается на переносах).

## 2. Вид кружка по статусу

Классы-модификаторы на `.skill-path-node`: `is-completed` / `is-current` / `is-locked`. Заливка — от `--accent` (инлайн из SKILL_META), тень 3D снизу — `color-mix`.
```css
.skill-path-node {
  position: relative; width: var(--node); height: var(--node); border-radius: 50%;
  display: grid; place-items: center; color: #fff; flex-shrink: 0;
  transition: transform .15s ease;
}
.skill-path-node.is-completed { background: var(--accent); box-shadow: 0 6px 0 color-mix(in srgb, var(--accent) 68%, #000); }
.skill-path-node.is-current   { background: var(--accent); box-shadow: 0 6px 0 color-mix(in srgb, var(--accent) 68%, #000);
                                animation: skill-node-pulse 2s ease-in-out infinite; }
.skill-path-node.is-locked    { background: var(--paper); color: var(--ink-soft);
                                border: 3px dashed var(--rule-strong); box-shadow: 0 6px 0 var(--rule); }
```
Содержимое кружка:
- **completed:** `<Check className="h-6 w-6" strokeWidth={3} aria-hidden />`, `aria-label={`Level ${n} completed`}`.
- **current:** номер `n` крупно (font-extrabold), плюс пульс-кольцо (`skill-node-pulse`, box-shadow spread на цвете `--accent`) = «ты здесь». Плюс над кружком маленький бейдж-указатель `You’re here` (см. ниже) чтобы путь ВЁЛ.
- **locked:** `<Lock className="h-5 w-5" aria-hidden />`, серый пунктирный.

Индикатор «ты здесь» (ведёт взгляд) — над current-кружком:
```tsx
{current && <span className="skill-path-here">You’re here</span>}
```
```css
.skill-path-here { display:inline-block; font-size:.7rem; font-weight:800; text-transform:uppercase;
  letter-spacing:.05em; color:var(--accent); background:color-mix(in srgb, var(--accent) 14%, transparent);
  padding:2px 10px; border-radius:9999px; animation: skill-bob 2.4s ease-in-out infinite; }
@keyframes skill-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
```

Подпись/бабл (caption, всегда центрирован — не уезжает за край на 375, п.8 ревьюера):
- **current:** карточка-бабл `premium-card` под кружком с текстом условия `skillLevelText(code, n)` + кнопка `button-primary` «Mark as complete». Условие текущего уровня видно СРАЗУ (DoD).
  ```tsx
  {current && (
    <div className="premium-card skill-path-bubble p-4 text-center">
      <p className="text-sm" style={{ color: 'var(--ink)' }}>{skillLevelText(code, n)}</p>
      <button type="button" onClick={() => onComplete(n)} disabled={pending}
              className="button-primary mt-3 w-full">
        {pending ? 'Saving…' : 'Mark as complete'}
      </button>
    </div>
  )}
  ```
  ```css
  .skill-path-bubble { max-width: 22rem; width: 100%; }
  @media (max-width: 420px) { .skill-path-bubble { max-width: 300px; } }
  ```
- **completed:** короткая подпись под кружком — `skillLevelText(code, n)` в один-два ряда, `text-xs` `var(--ink-muted)`, `max-width: 15rem`, центр. (Пройденные условия показываем всегда — они не секретны.)
- **top completed** (самый верхний пройденный, `n === completedLevel`): под подписью — кнопка undo (см. §4).
- **locked без peek:** подпись `Locked` с иконкой (как сейчас), `aria-label="Locked — complete previous levels first"`.
- **locked при peek:** показать `skillLevelText(code, n)` тем же стилем что completed-подпись, НО кружок остаётся `is-locked` и некликабельным (peek только раскрывает текст, прохождение недоступно — DoD).

Статусные формулы — БЕЗ изменений: `completed = n <= completedLevel; current = n === completedLevel + 1; locked = n > completedLevel + 1; isTopCompleted = completed && n === completedLevel; pending = pendingLevel === n`.

## 3. Взрыв на complete («бум»)

Триггер: оптимистичный апдейт `completedLevel` уже мгновенный. Ловим переход уровня в completed — когда `completedLevel` вырос.
```tsx
const prevCompleted = useRef(completedLevel);
const [burstLevel, setBurstLevel] = useState<number | null>(null);
useEffect(() => {
  const prev = prevCompleted.current;
  prevCompleted.current = completedLevel;
  if (completedLevel > prev) {
    // reduced-motion: НЕ запускаем взрыв (частицы не рендерятся)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) setBurstLevel(completedLevel); // именно тот уровень, что стал пройден
  }
}, [completedLevel]);
```
Рендер burst-слоя внутри кружка когда `burstLevel === n`, снимаем по `onAnimationEnd`:
```tsx
{burstLevel === n && (
  <span className="skill-burst" aria-hidden onAnimationEnd={() => setBurstLevel(null)}>
    <span className="skill-burst-ring" />
    {Array.from({ length: 8 }).map((_, i) => (
      <span key={i} className="skill-burst-dot" style={{ '--a': `${i * 45}deg` } as CSSProperties} />
    ))}
  </span>
)}
```
Плюс на самом кружке при взрыве — короткий scale-pop: добавить класс `is-burst` когда `burstLevel === n` → `animation: skill-node-pop .45s`.
CSS (только transform/opacity, взрыв ≤600ms):
```css
.skill-burst { position:absolute; inset:0; pointer-events:none; }
.skill-burst-ring { position:absolute; left:50%; top:50%; width:var(--node); height:var(--node);
  border-radius:50%; border:3px solid var(--accent); transform:translate(-50%,-50%) scale(.4);
  animation: skill-burst-ring .55s ease-out forwards; }
.skill-burst-dot { position:absolute; left:50%; top:50%; width:9px; height:9px; border-radius:50%;
  background:var(--accent); transform:translate(-50%,-50%) rotate(var(--a)) translateY(0);
  animation: skill-burst-dot .6s ease-out forwards; }
@keyframes skill-burst-ring { to { transform:translate(-50%,-50%) scale(1.9); opacity:0; } }
@keyframes skill-burst-dot  { 0%{opacity:1} 100%{ transform:translate(-50%,-50%) rotate(var(--a)) translateY(-46px) scale(.3); opacity:0; } }
@keyframes skill-node-pop   { 0%{transform:var(--node-tf)} 40%{transform:scale(1.18)} 100%{transform:var(--node-tf)} }
@keyframes skill-node-pulse { 0%,100%{ box-shadow:0 6px 0 color-mix(in srgb,var(--accent) 68%,#000), 0 0 0 0 color-mix(in srgb,var(--accent) 45%,transparent);} 70%{ box-shadow:0 6px 0 color-mix(in srgb,var(--accent) 68%,#000), 0 0 0 14px transparent;} }
```
Замечание про offset-кружки и pop: у current/completed кружка есть `translateX` от плетения — `skill-node-pop` перезапишет transform и «дёрнет» узел в центр. Решение: обернуть плетение-offset НЕ на `.skill-path-node`, а на внешний `.skill-path-node-wrap` (offset живёт на обёртке), а pop/pulse — на внутреннем `.skill-path-node`. Тогда анимации scale не конфликтуют с offset. Уточнение к §1: смещение вешать на обёртку `.skill-path-node-wrap`, а не на сам кружок.

Reduced-motion: взрыв не рендерится (гейт в effect); пульс/боб глобальное правило в globals.css (`animation-iteration-count:1`) само гасит до статики. Двойная защита — ок. При reduced-motion переход в completed = мгновенная смена вида кружка (галочка), без частиц.

## 4. Undo (Mark as not done)

Живёт под подписью верхнего пройденного узла (`isTopCompleted`), рядом с местом, которого касается:
```tsx
{isTopCompleted && (
  <button type="button" onClick={() => onUncomplete(n)} disabled={pending}
          className="button-ghost mt-1 text-sm" style={{ minHeight: 44 }}>
    Mark as not done
  </button>
)}
```
Логика та же (последний пройденный откатывается). Кнопка ≥44px по высоте.

## 5. Кусок исполнения (один), порядок и DoD

Один кусок (файлы не пересекаются с чужой работой):
1. `src/app/globals.css` — в КОНЕЦ файла добавить секцию `/* Skills path */`: классы `.skill-path*`, `.skill-burst*`, `.skill-path-here`, keyframes `skill-*`. Токены не дублировать — брать существующие. Стиль файла — unlayered (как весь globals); специфичность низкая, с Tailwind-утилитами не конфликтуем (у узлов либо кастомный класс, либо утилиты — не смешиваем конфликтующие свойства; п.22 ревьюера).
2. `src/components/skills/SkillLadder.tsx` — переписать тело `<ol>` под путь: обёртка узла (offset), кружок (статус + burst + pop/pulse), caption (бабл/подпись/undo), индикатор «You’re here». Шапку (иконка, имя, «Level X of 10», кнопка Peek) оставить как есть. Добавить `useRef`+`useState`+`useEffect` для burst (§3). Импорты: добавить `useEffect, useRef, useState` из `react`, тип `CSSProperties`.

Порядок: сначала CSS (2 файла независимы, но CSS первым чтобы видеть результат), затем TSX.

DoD (проверяемо):
- Статусы completed/current/locked по прежним формулам; условие current видно сразу; locked-тексты скрыты, Peek раскрывает, но узлы некликабельны для прохождения.
- «Mark as complete» на current (pending → «Saving…», disabled), «Mark as not done» на top-completed, оптимистика/тосты в хуке не тронуты.
- Complete → взрыв (кольцо+частицы+pop) на нужном кружке, ≤600ms, снимается сам; reduced-motion → без взрыва, мгновенная галочка.
- 375 / 768 / 1440: путь и баблы в габаритах, ничего не уезжает за край, ничего под нижним таб-баром (padding-bottom у `.skill-path` = 96px; проверить на 375 последний узел/undo).
- Интерактив (обе кнопки) ≥44px. Иконочных «кнопок» нет; у декоративных иконок `aria-hidden`, у статусных — `aria-label`.

Гейт: `pnpm build && pnpm lint` — зелёный. Ручная проверка трёх ширин + complete/undo/peek + системный reduced-motion.

---

## Прогон frontend-ui-design-reviewer (добавлено в план 6 пунктов)

- **п.3/4 (контент под fixed-зонами, карта зон):** добавлен `padding-bottom:96px` на `.skill-path` и явный критерий «ничего под нижним таб-баром (`.nav-tab`)»; спайн `::before` тоже обрезан снизу (`bottom:96px`), чтобы не лез под таббар. Тостов компонент не рисует (они в хуке) → конфликта зон нет; z-index: спайн `0`, ряды `1`, локальный burst `inset:0` внутри узла (в потоке, без глобального z).
- **п.6 (молчаливые действия):** complete даёт мгновенную реакцию — оптимистичная галочка + взрыв ≤200ms от клика; undo — мгновенный откат вида; pending-текст «Saving…». Ни одно действие не молчит.
- **п.8 (обрезанные поповеры):** бабл текущего уровня центрирован и `max-width` (22rem / 300px на ≤420px), НЕ offset-ится → не уезжает за край на 375; не лежит в `overflow`-контейнере.
- **п.13 (доступность):** статусные иконки — `aria-label`, декоративные — `aria-hidden`; кнопки — нативный `<button>` (не div); кружки-узлы декоративны/неинтерактивны (не `<button>`, чтобы не плодить фокус-ловушки на непроходимых уровнях); контраст белого текста на `--accent` и `--ink-muted` подписей ≥4.5:1 — проверить самый светлый акцент (`--duo-gold` для vocabulary: белый на золотом слаб → для completed/current кружков vocabulary использовать тёмный текст `var(--owl-ink)`, как уже делает `.duo-node--gold`). Добавлено правило: если `accent === 'var(--duo-gold)'` → цвет содержимого кружка `var(--owl-ink)`.
- **п.18 (хрупкие анимации):** все анимации — transform/opacity/box-shadow; основные 150–300ms, взрыв 550–600ms (осознанное исключение под «бум»), ease-out; каждая объясняет состояние (pulse=«ты здесь», burst=«пройдено», bob=указатель). Reduced-motion гасит всё.
- **п.19/20 (три ширины, спроектированный мобильный лейаут):** offset и диаметр заданы явными переменными для 375 и ≥768; узлы не «переносятся сами» (по одному на строку), бабл всегда центрирован. На 375 узел уменьшен до 72px и offset до ±36px — не зажимаем, а меняем метрики под ширину.

Прочее из react-best-practices, заложенное в план: компоненты не определяем внутри компонента (рендер узла — inline JSX в `map`, экстракции нет); условный рендер через `cond && (...)` только на булевых флагах (не на числах) — `0` не утечёт; `matchMedia` читаем в effect (client-only, без SSR-гидрации); burst снимаем по `onAnimationEnd`, без таймеров-утечек; `prevCompleted` в `useRef` — сравнение prop между рендерами без лишних ре-рендеров.
