# План — Design-полиш страницы /plan (цели)

Вид: Design-полиш production UI. Фаза: планирование (УЖАТО). Исполнение: 1 кусок, Sonnet.
Стек: Next.js 15 + React 19 + Tailwind 4. Полиш почти целиком в `src/app/globals.css`
(секция plan, строки ~603–811) + минимальные правки JSX (`d`-путь шеврона, пара классов).
**Инварианты руководителя не трогать** (структура, огромный широкий шеврон-«улыбка»,
видимость мусорки/«+» в свёрнутом виде, мусорка средней под её чекбоксом, красная галочка
большой/зелёные средних, line-through+opacity для выполненных, функциональность/анимации
удаления и expand). Меняем только визуальный слой; допустимы мелкие структурные правки
разметки ради выравнивания.

Файл dev-сервер жив → **build запрещён**. Гейт: `npx tsc --noEmit` + `pnpm lint`.

---

## Что дал прогон дизайн-скиллов

**emil-design-eng** (материя, невидимые детали, отклик на нажатие):
- Кружки-кнопки (`goal-icon-btn`) плоские: только `scale(0.94)` на active, фон на hover. В языке
  приложения кнопки — «пружинистые пятачки» с подложкой-тенью (`btn-3d`, `box-shadow: 0 4px 0`,
  `translateY(4px)` на нажатии). Кнопки цели этого не читают → сделать пятачками.
- Шеврон — тонкая серая палка (stroke 3, цвет `--ink-muted`, острый V). Нет присутствия. Дать
  вес (толще), благородную дугу (квадратичная кривая-«улыбка» вместо острого V), реальную
  поверхность-подложку у кнопки, чтобы читалась как контрол. Кроссфейд ∨/∧ уже есть — сохранить.
- Переходы generic `0.15s ease`. Добавить один общий сильный ease-out токен для hover/press.
- prefers-reduced-motion уже гасит `btn-3d` active (globals.css:413) — расширить на наши press-состояния.

**design-taste-frontend** (иерархия, материя, ритм, анти-муть):
- Плашки — плоский `color-mix(hue 16%, #fff)` без края и глубины → «блёкло и грязновато».
  Муть от подмешивания насыщенного тона в чистый белый на 16% (грязный midtone). Чистить:
  использовать designed-пастель-токены (`--danger-soft`, зелёный на 10%), задать **тинт-бордер**
  цвета акцента для чёткости края + мягкую тонированную тень (Section 4.4: тень в тон фона).
- Слабая иерархия: паддинг большой красной плашки = паддингу средней зелёной. Красная —
  «герой», должна быть весомее (больше паддинг, чуть сильнее край/фон); зелёные — легче/спокойнее.
- Нет ритма: намешаны `p-4 / gap-3 / pt-3 / space-y-2 / 0.5rem 0.65rem`. Ввести единую шкалу.
- Радиусы: контейнер 16, плашки 14, инпут 12, чекбокс/кнопки круг — привести к одной шкале
  (контейнер 18, плашки 14, инпут 14, пилюли/круги — full). Shape-lock.
- Бордер пустого чекбокса `--rule` (#E5E5E5) теряется на цветной плашке → тинт в тон плашки.

**frontend-ui-design-reviewer** (свой чеклист «тупых» багов) — прогнан по плану:
контент под fixed — нет; конфликт зон тост/панель — ConfirmDialog модальный, ок; голые нативные
контролы — чекбокс кастомный (ок); молчаливые действия — toggle даёт pop/particles (ок);
обрезка поповеров — нет; наезды в grid — нет. Блокеров нет. Пункт в план: следить, чтобы
press-состояния (translateY) не сдвигали hit-зону и не давали горизонтальный скролл на 375.

---

## Дизайн-решения (конкретные значения)

Все правки — в существующих классах секции plan `globals.css`. Токены уже есть:
`--duo-red #FF4B4B`, `--duo-green #58CC02`, `--duo-green-haze #D7FFB8`, `--danger-soft #FFDFE0`,
`--rule #E5E5E5`, `--rule-strong #D7D7D7`, `--surface #FFF`, `--surface-hover #F7F7F7`,
`--ink #4B4B4B`, `--ink-muted #777`, `--ink-soft #AFAFAF`, `--color-accent-ring`.

### 0. Общий ease-токен (в `:root`, рядом с другими токенами)
```css
--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
```
Использовать в transition новых hover/press ниже.

### 1. Нейтральный контейнер `.plan-goal-card` (сейчас `ink 5%`, radius 16, no border)
```css
.plan-goal-card {
  background: var(--surface-hover);            /* #F7F7F7 — чистый нейтрал вместо мутного ink 5% */
  border: 2px solid var(--rule);
  border-radius: 18px;
  box-shadow: none;
}
```
Паддинг оставить `p-4` в JSX. Смысл: контейнер — спокойная «подложка», плашки на ней «приподняты».

### 2. Красная плашка большой цели `.plan-goal-row-card` (герой)
```css
.plan-goal-row-card {
  background: var(--danger-soft);              /* #FFDFE0 — чистая designed-пастель, не муть */
  border: 2px solid color-mix(in srgb, var(--duo-red) 32%, #fff);
  border-radius: 14px;
  padding: 0.7rem 0.85rem;                     /* весомее средних — иерархия */
  box-shadow: 0 2px 6px color-mix(in srgb, var(--duo-red) 18%, transparent); /* тень в тон */
}
```

### 3. Зелёная плашка средней цели `.plan-row-card` (спокойнее героя)
```css
.plan-row-card {
  background: color-mix(in srgb, var(--duo-green) 10%, #fff); /* чище, чем 16% */
  border: 2px solid color-mix(in srgb, var(--duo-green) 26%, #fff);
  border-radius: 14px;
  padding: 0.6rem 0.75rem;
  box-shadow: 0 1px 4px color-mix(in srgb, var(--duo-green) 14%, transparent);
}
```

### 4. Чекбокс — тинт бордера в тон плашки (сейчас `--rule` теряется)
Добавить контекстные правила (класс `.goal-checkbox::before` уже красит бордер `--rule`):
```css
.plan-goal-row-card .goal-checkbox::before { border-color: color-mix(in srgb, var(--duo-red) 38%, #fff); }
.plan-row-card      .goal-checkbox::before { border-color: color-mix(in srgb, var(--duo-green) 34%, #fff); }
```
Checked-состояние (`aria-checked=true` → заливка `--accent`) и `.pop` не трогать.

### 5. Кружки-кнопки `.goal-icon-btn` — «пятачки» в языке приложения
Перевести на паттерн видимого пятачка через `::before` (как у `.goal-checkbox`): тап-зона 44px
остаётся, видимый круг меньше и с подложкой-тенью. Это даёт нормальный размер sm-мусорки под
24px-чекбоксом и убирает 44px-«блин».
```css
.goal-icon-btn {
  position: relative;
  width: 44px; height: 44px;
  display: grid; place-items: center;
  color: var(--ink-muted);
  transition: transform 0.12s var(--ease-out-strong);
}
.goal-icon-btn::before {
  content: ""; position: absolute; inset: 4px;      /* видимый пятак 36px */
  border-radius: 50%;
  background: #fff; border: 2px solid var(--rule);
  box-shadow: 0 2px 0 var(--rule);
  transition: box-shadow 0.12s var(--ease-out-strong),
              background-color 0.15s ease, border-color 0.15s ease;
}
.goal-icon-btn svg { position: relative; z-index: 1; }
.goal-icon-btn:hover:not(:disabled)  { transform: translateY(-1px); }
.goal-icon-btn:hover:not(:disabled)::before  { box-shadow: 0 3px 0 var(--rule); }
.goal-icon-btn:active:not(:disabled) { transform: translateY(2px); }
.goal-icon-btn:active:not(:disabled)::before { box-shadow: 0 0 0 var(--rule); }
.goal-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.goal-icon-btn:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; border-radius: 50%; }
.goal-icon-btn--sm::before { inset: 8px; }          /* видимый пятак 28px */
.goal-icon-btn--sm svg { width: 15px; height: 15px; }
```
Варианты (перекрасить край/тень/hover-фон пятачка в тон):
```css
.goal-icon-btn--danger { color: var(--duo-red); }
.goal-icon-btn--danger::before { border-color: color-mix(in srgb, var(--duo-red) 30%, #fff); box-shadow: 0 2px 0 color-mix(in srgb, var(--duo-red) 22%, #fff); }
.goal-icon-btn--danger:hover:not(:disabled)::before { background: var(--danger-soft); box-shadow: 0 3px 0 color-mix(in srgb, var(--duo-red) 22%, #fff); }
.goal-icon-btn--danger:active:not(:disabled)::before { box-shadow: 0 0 0 color-mix(in srgb, var(--duo-red) 22%, #fff); }
.goal-icon-btn--confirm { color: var(--duo-green); }
.goal-icon-btn--confirm::before { border-color: color-mix(in srgb, var(--duo-green) 30%, #fff); box-shadow: 0 2px 0 color-mix(in srgb, var(--duo-green) 22%, #fff); }
.goal-icon-btn--confirm:hover:not(:disabled)::before { background: var(--duo-green-haze); box-shadow: 0 3px 0 color-mix(in srgb, var(--duo-green) 22%, #fff); }
.goal-icon-btn--confirm:active:not(:disabled)::before { box-shadow: 0 0 0 color-mix(in srgb, var(--duo-green) 22%, #fff); }
```
**Удалить** старое правило `.plan-goal-card .goal-icon-btn--danger { background: … }` (globals.css:742-743):
теперь фон рисует `::before`, отдельный бэкдроп не нужен.

### 6. Шеврон-кнопка `.goal-chevron-btn` — реальная поверхность-подложка
```css
.goal-chevron-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 0; height: 48px; padding: 0 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--ink) 4%, #fff);
  border: 2px solid var(--rule);
  color: var(--ink-muted);
  transition: transform 0.15s var(--ease-out-strong),
              background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.goal-chevron-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--rule-strong); color: var(--ink); transform: translateY(-1px); }
.goal-chevron-btn:active:not(:disabled) { transform: translateY(1px) scale(0.99); }
.goal-chevron-btn:focus-visible { outline: 2px solid var(--color-accent-ring); outline-offset: 2px; }
```
Инвариант «огромный широкий» — сохранён: `flex-1`, `justify-content:center`, дуга тянется на всю ширину.

### 7. Дуга шеврона — толще, благороднее (`.goal-chevron-icon*` + `d`-путь в JSX)
CSS:
```css
.goal-chevron-icon { width: 100%; height: 26px; overflow: visible; }  /* было 20px — щедрее «улыбка» */
.goal-chevron-icon-path { stroke-width: 4.5; ... }                    /* было 3; non-scaling-stroke → px */
```
Остальные свойства пути (fill none, currentColor, round caps/join, opacity-кроссфейд, translate-сдвиги
и `--visible`) — **не трогать**: кроссфейд без вращения сохраняется.

JSX (`PlanGoalCard.tsx`, `ChevronArc`): заменить острый V на квадратичную дугу-«улыбку», viewBox тот же
`0 0 100 24`, `preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"` оставить:
- down (видна в свёрнутом): `d="M6 5 Q50 23 94 5"`
- up   (видна в раскрытом): `d="M6 19 Q50 1 94 19"`
Классы путей и логику `open ? …` не менять.

### 8. Инпут `.goal-input` — радиус в шкалу
`border-radius: 12px` → `14px`. Фокус-бордер зелёный оставить. (Косметика, shape-lock.)

### 9. Ритм/выравнивание (JSX-классы, без ломки структуры)
- `PlanGoalCard.tsx`: строка большой цели `flex items-start gap-3` → `flex items-center gap-2.5`
  (чекбокс и заголовок по центру плашки; красная галочка ровно напротив текста).
- Футер-ряд контролов `flex items-center gap-2` — оставить `items-center`; проверить, что при
  press-translateY ряд не «прыгает» (transform не влияет на layout — ок).
- Колонка средней цели (`MediumGoalRow.tsx`) `flex flex-col items-center gap-1` — оставить, но
  проверить визуальный баланс: чекбокс sm (24px) над мусоркой sm (28px пятак) — приемлемо.
- Строка средней `flex items-start gap-3` → `flex items-center gap-2.5` для вертикального центрирования
  колонки контролов относительно текста (если текст в одну строку). Если текст многострочный —
  вернуть `items-start`; выбрать `items-start` как безопасный дефолт (тексты бывают длинные),
  но уменьшить `gap-3 → gap-2.5`. **Решение: `items-start gap-2.5`** (текст может переноситься).
- Заголовок большой цели: `text-lg` оставить; вес `font-extrabold` оставить (иерархия ок).

### 10. prefers-reduced-motion
В существующий блок `@media (prefers-reduced-motion: reduce)` (около globals.css:413) добавить гашение
наших press-сдвигов:
```css
.goal-icon-btn:active:not(:disabled),
.goal-chevron-btn:hover:not(:disabled),
.goal-chevron-btn:active:not(:disabled),
.goal-icon-btn:hover:not(:disabled) { transform: none; }
```
(Opacity/цвет-переходы оставить — они помогают понимать состояние.)

### 11. Пустое состояние и заголовок страницы (page.tsx) — лёгкий полиш
- Заголовок/подзаголовок — оставить как есть (`font-display text-3xl`, подпись — ок).
- Пустое состояние: оставить структуру; заменить `button-ghost` на 3D-кнопку языка приложения
  для акцента действия — **опционально**, только если `.btn-3d.btn-green` есть и подходит по смыслу
  («Go to Skills» — вторичное действие, `button-ghost` допустим). **Дефолт: не трогать пустое
  состояние** (вне сырых жалоб; экономим риск). Упомянуть в отчёте как возможный следующий шаг.

---

## Кусок исполнения (один, Sonnet)

Все правки — атомарны и не пересекаются с другими фичами. Один исполнитель:
1. `src/app/globals.css` — пункты 0–8, 10 (плашки, чекбокс-тинт, пятачки-кнопки, шеврон-кнопка+дуга,
   инпут-радиус, reduced-motion, ease-токен). Удалить строки 742-743 (старый danger-backdrop).
2. `src/components/plan/PlanGoalCard.tsx` — пункт 7 (`d`-пути дуги) + пункт 9 (классы выравнивания
   строки большой цели и футера).
3. `src/components/plan/MediumGoalRow.tsx` — пункт 9 (`items-start gap-3 → items-start gap-2.5`).
4. (Опц., по решению — не делать) page.tsx пустое состояние.

Логику/хуки/обработчики/анимации удаления и expand — **не трогать**.

---

## Критерии готовности
- Плашки читаются чисто (не мутно): красная — весомый «герой» с чётким тинт-краем; зелёные —
  спокойнее и легче; у обеих виден край и мягкая тень в тон.
- Все кружки-кнопки — единые «пятачки» с подложкой-тенью, hover-подъёмом и active-прижатием;
  sm-мусорка визуально меньше 44px-блина; danger/confirm/plain консистентны.
- Шеврон: широкая благородная дуга-«улыбка» (толще, viewBox тот же, огромный на всю ширину),
  кнопка имеет поверхность-подложку; кроссфейд ∨/∧ без вращения сохранён; одинаков в обоих состояниях.
- Чекбоксы: пустой бордер тинтован в тон плашки; красная галочка у большой, зелёные у средних.
- line-through + opacity 0.55 для выполненных — без изменений (не «клякса»).
- Единый ритм отступов и радиусов (контейнер 18 / плашки 14 / инпут 14 / круги-пилюли full).
- Выравнивание колонок чекбокс/мусорка/текст ровное; красная галочка напротив заголовка.
- Все hover/focus-visible/active заданы; focus-visible-кольца сохранены; touch-хиты ≥44px.
- 375 / 768 / 1440: нет горизонтального скролла; контролы не наезжают; press-состояния не двигают layout.
- prefers-reduced-motion: сдвиги-transform погашены, цвет/opacity-подсказки остались.
- Функциональность (toggle, delete-анимации, expand/collapse, add-input) не сломана.

## Гейт (build запрещён — жив dev-сервер)
```
npx tsc --noEmit
pnpm lint
```
Оба зелёные по затронутой зоне. Красное — чинит исполнитель до сдачи.
