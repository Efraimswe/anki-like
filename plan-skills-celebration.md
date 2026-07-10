# Plan — Skills Level-Up Celebration (Production frontend, vid 3)

Проект: anki-like · Next.js 15 / React 19 / TS / Tailwind 4. Стиль — существующие duo-токены в `src/app/globals.css`.
Цель: при пометке уровня complete на `/skills/[skill]` — «вау»-празднование: модалка-поздравление + синтезированная фанфара + тряска карточки + волны конфетти. Узловой взрыв на пути (`skill-burst`) остаётся, модалка приходит поверх него.

Новых npm-зависимостей НЕТ. Хук `use-skills.ts` и API НЕ трогаем.

---

## 0. Ключевые решения (зафиксированы)

1. **Триггер — рост `completedLevel` внутри `SkillLadder.tsx`**, тем же сигналом, что уже ловит узловой burst (`useRef(prevCompleted)` + `useEffect`). Никакого onSuccess-колбэка через пропсы, контракт хука не меняется. Празднование, как и burst, срабатывает на ОПТИМИСТИЧЕСКИЙ рост — фидбек мгновенный (<200ms). Edge-кейс отката при ошибке мутации: модалка уже открыта, поверх появится error-тост (он выше по z, см. §5) — редко, приемлемо, помечено в критериях.
2. **Звук — Web Audio API синтез** (рекомендация лида): нулевые ассеты, лицензионно чисто, никакого CDN. `AudioContext` создаётся лениво в момент клика (клик «Mark as complete» = user gesture, autoplay-политика не мешает).
3. **Тряска — transform на КАРТОЧКЕ модалки, не на body.** Оверлей `fixed inset-0 overflow-hidden` → тряска и конфетти клипаются вьюпортом, документ не скроллится, горизонтального скролла нет.
4. **10-й уровень (навык завершён)** — отличается ТОЛЬКО текстом («Skill mastered») + золотой медалью/трофеем; отдельной механики не вводим (YAGNI). Определяем `isMastery = level === MAX_LEVEL`.
5. **prefers-reduced-motion** — глобальный блок в globals.css уже гасит все `animation-duration` до 0.001ms (модалка просто мгновенно оказывается в финальном состоянии — ок). Дополнительно JS-гардим: при reduce НЕ рендерим волны конфетти и не вешаем класс тряски (fade-появление достаточно). **Звук оставляем** — это аудио, не motion; reduce гасит только движение.

## 1. Файлы (границы лида)

| Файл | Действие |
|---|---|
| `src/components/skills/LevelCelebration.tsx` | НОВЫЙ — модалка + конфетти (portal, focus-trap) |
| `src/lib/celebration-sound.ts` | НОВЫЙ — синтез фанфары |
| `src/components/skills/SkillLadder.tsx` | ПРАВКА — состояние `celebrateLevel`, монтирование `<LevelCelebration/>`, вызов звука |
| `src/app/globals.css` | ДОБАВИТЬ секцию `/* Level celebration */` в КОНЕЦ файла (keyframes тряски + волн + стили карточки) |

Референс-паттерн для модалки (focus-trap, Escape, overlay-click, portal): **`src/components/ui/ConfirmDialog.tsx`** — скопировать его структуру a11y 1:1, не изобретать.

## 2. `celebration-sound.ts` — спека синтеза

Экспорт: `export function playCelebration(opts?: { grand?: boolean }): void`

Логика:
- Ленивый singleton `let ctx: AudioContext | null`. При первом вызове: `ctx = new (window.AudioContext || (window as any).webkitAudioContext)()`. Если `ctx.state === 'suspended'` → `ctx.resume()`.
- Master: `const master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination)` (0.22 чтобы не клиппило при наложении голосов).
- Хелпер `note(freq, start, dur, type, peak)`:
  ```
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
  const g = ctx.createGain();
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.012);        // fast attack
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);   // decay/release
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  ```
- **Фанфара (C-major, триумф):** восходящее арпеджио + удержанный аккорд:
  - C5 523.25 @0.00, E5 659.25 @0.08, G5 783.99 @0.16, C6 1046.50 @0.24 — каждая `type:'triangle'`, dur 0.5, peak 0.5.
  - Удержанный аккорд C6+E6(1318.51)+G6(1567.98) @0.30, dur 0.7, peak 0.32, `type:'triangle'`.
- **Бас-удар «бум»:** C2 65.41, `type:'sine'`, @0.00, dur 0.35, peak 0.9 (низ не режется мастер-гейном так сильно).
- **Шиммер:** две расстроенные синусоиды C7 2093 и ~D#7 3136, @0.26, dur 0.4, peak 0.12 — искристый хвост.
- **`grand` (10-й уровень):** добавить финальный октавный флуориш C7 2093 @0.42, dur 0.6, peak 0.4 (`type:'triangle'`) — «ещё грандиознее».
- Обернуть тело в `try/catch` (no-op при ошибке AudioContext — звук не критичен, молча не глотать логику, но и не ронять UI): `catch { /* audio unsupported — silent */ }`. Это единственное разрешённое «тихое» — фидбек и так есть визуально.

Никаких ассетов, никакого `public/sounds/`.

## 3. `LevelCelebration.tsx` — скелет

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trophy } from 'lucide-react'; // медаль/трофей — НЕ эмодзи

interface Props {
  level: number;
  skillName: string;
  accent: string;       // SKILL_META[code].accent, напр. 'var(--duo-green)'
  isMastery: boolean;   // level === MAX_LEVEL
  reduceMotion: boolean;
  onClose: () => void;
}

export default function LevelCelebration({ level, skillName, accent, isMastery, reduceMotion, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // фокус на CTA при открытии
  useEffect(() => { closeRef.current?.focus(); }, []);

  // Escape закрывает + trap Tab (скопировать из ConfirmDialog.tsx)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') { /* trap внутри dialogRef, как в ConfirmDialog */ }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = isMastery ? `${skillName} mastered!` : 'Level up!';
  const body = isMastery
    ? `You've completed all 10 levels of ${skillName}. Incredible work.`
    : `You reached Level ${level} in ${skillName}. Keep the streak going!`;
  const cta = isMastery ? 'Claim it' : 'Keep going';

  const overlay = (
    <div
      className="level-celebration-overlay"
      onClick={onClose}                              // клик по фону закрывает
    >
      {/* Волны конфетти — только если !reduceMotion; pointer-events:none; клипаются оверлеем */}
      {!reduceMotion && (
        <div className="level-celebration-confetti" aria-hidden="true">
          {/* 3 волны × N частиц, каждая с --a угол, --d задержка, --c цвет (accent/gold/green) */}
        </div>
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        className={`premium-card level-celebration-card${reduceMotion ? '' : ' is-shaking'}`}
        style={{ '--accent': accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}         // клик по карточке не закрывает
      >
        <span className="level-celebration-medal" aria-hidden="true">
          <Trophy strokeWidth={2.5} />
        </span>
        <h2 id="celebration-title" className="font-display" >{title}</h2>
        <p>{body}</p>
        <button ref={closeRef} type="button" onClick={onClose} className="button-primary w-full">
          {cta}
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
```

Тексты (English, финальные):
- Level up (1–9): title `Level up!` · body `You reached Level {n} in {skillName}. Keep the streak going!` · CTA `Keep going`
- Mastery (10): title `{skillName} mastered!` · body `You've completed all 10 levels of {skillName}. Incredible work.` · CTA `Claim it`

## 4. Правка `SkillLadder.tsx`

- Импорт: `import { MAX_LEVEL } ...` (уже есть MAX_LEVEL), `LevelCelebration`, `playCelebration` из `@/lib/celebration-sound`.
- Внутри существующего growth-`useEffect` (тот же, что ставит `burstLevel`) — ДОБАВИТЬ, НЕ дублируя детект:
  ```ts
  useEffect(() => {
    const prev = prevCompleted.current;
    prevCompleted.current = completedLevel;
    if (completedLevel > prev) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) setBurstLevel(completedLevel);
      setCelebrateLevel(completedLevel);            // модалка всегда (reduce → просто fade)
      playCelebration({ grand: completedLevel === MAX_LEVEL });
    }
  }, [completedLevel]);
  ```
  Новое состояние: `const [celebrateLevel, setCelebrateLevel] = useState<number | null>(null);`
  `reduceMotion` для пропса вычислить один раз в момент открытия и хранить, либо передать `window.matchMedia(...).matches` при рендере (ок для клиентского компонента).
- В конце JSX (после `</ol>`), рядом, смонтировать:
  ```tsx
  {celebrateLevel !== null && (
    <LevelCelebration
      level={celebrateLevel}
      skillName={name}
      accent={accent}
      isMastery={celebrateLevel === MAX_LEVEL}
      reduceMotion={window.matchMedia('(prefers-reduced-motion: reduce)').matches}
      onClose={() => setCelebrateLevel(null)}
    />
  )}
  ```
- `page.tsx` НЕ трогаем (монтируем внутри SkillLadder — минимально).

## 5. `globals.css` — секция в КОНЕЦ файла

Карта слоёв (z-index, п.16 ревьюера — фиксируем явно):
- контент < path-node burst (в потоке) < тосты `z-[1000]` < **celebration overlay `z-index: 1100`** (модалка выше тостов — она главный слой; error-тост при откате всё равно виден поверх? НЕТ — тост ниже. Приемлемо: модалку можно закрыть, тост останется. Помечено в критериях как известное поведение).

```css
/* ════ Level celebration ════ */
.level-celebration-overlay {
  position: fixed; inset: 0; z-index: 1100;
  display: grid; place-items: center; padding: 1.5rem;
  overflow: hidden;                                   /* клип конфетти/тряски, без скролла */
  background: color-mix(in srgb, var(--ink) 55%, transparent);
  animation: celebration-overlay-in 160ms ease-out;
}
.level-celebration-card {
  position: relative; z-index: 1; max-width: 24rem; width: 100%;
  text-align: center; padding: 2rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  animation: celebration-card-in 220ms cubic-bezier(0.2,0.8,0.2,1);
}
.level-celebration-card.is-shaking { animation: celebration-card-in 220ms cubic-bezier(0.2,0.8,0.2,1), celebration-shake 500ms ease-in-out 180ms; }
.level-celebration-medal {
  display: grid; place-items: center; width: 4.5rem; height: 4.5rem; border-radius: 9999px;
  color: #fff; background: var(--accent);
  box-shadow: 0 6px 0 color-mix(in srgb, var(--accent) 68%, #000);
  animation: celebration-medal-pop 300ms cubic-bezier(0.2,0.8,0.2,1) 120ms both;
}
.level-celebration-medal svg { width: 2.25rem; height: 2.25rem; }
.level-celebration-card h2 { font-size: 1.5rem; font-weight: 800; color: var(--ink); }
.level-celebration-card p  { font-size: 0.95rem; color: var(--ink-muted); }

/* Конфетти: частицы позиционированы от центра, разлетаются по --a, волнами через --d */
.level-celebration-confetti { position: absolute; inset: 0; pointer-events: none; }
.level-celebration-confetti span {
  position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; border-radius: 2px;
  background: var(--c); opacity: 0;
  animation: celebration-confetti 900ms ease-out var(--d) forwards;
}

@keyframes celebration-overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes celebration-card-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes celebration-medal-pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes celebration-shake {
  0%,100% { transform: translateX(0); } 15% { transform: translateX(-10px) rotate(-1.5deg); }
  30% { transform: translateX(9px) rotate(1.5deg); } 45% { transform: translateX(-7px) rotate(-1deg); }
  60% { transform: translateX(5px) rotate(0.8deg); } 75% { transform: translateX(-3px); }
}
@keyframes celebration-confetti {
  0%   { opacity: 1; transform: translate(-50%,-50%) rotate(0) scale(1); }
  100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a)) translateY(-220px) scale(0.4); }
}
```

Конфетти-разметка в компоненте: 3 волны по 8 частиц (24 span), генерить в JSX:
```tsx
{[0, 1, 2].map((wave) =>
  Array.from({ length: 8 }).map((_, i) => (
    <span key={`${wave}-${i}`} style={{
      '--a': `${i * 45 + wave * 15}deg`,
      '--d': `${wave * 180}ms`,                        // «бум-бум-ка-бум» — три волны
      '--c': [accent, 'var(--duo-gold)', 'var(--duo-green)'][wave],
    } as React.CSSProperties} />
  ))
)}
```
Оборачивать `.level-celebration-confetti` вокруг них (см. §3). Tailwind v4: имена `.level-celebration-*` уникальны, с утилитами не конфликтуют → `@layer` не нужен (keyframes и bespoke-классы глобальны). Не использовать `.skill-*` имена, чтобы не пересечься с path.

## 6. Один кусок исполнения (не дробим — связная фича)

**Кусок 1 (Sonnet):** создать `celebration-sound.ts` (§2) → создать `LevelCelebration.tsx` (§3, focus-trap скопировать из `ConfirmDialog.tsx`) → добавить CSS-секцию в конец `globals.css` (§5) → внести правки в `SkillLadder.tsx` (§4). Файлы не пересекаются с чужими зонами.

Критерии готовности:
- `pnpm build && pnpm lint` — зелёные, без `any` (Web Audio типизировать; `webkitAudioContext` через локальный каст с комментарием), без warning React (эффект с cleanup на listener, deps корректны).
- Клик «Mark as complete» на уровне 1–9: узловой burst играет, звучит фанфара, модалка появляется fade+scale, медаль pop, карточка трясётся один раз, 3 волны конфетти клипаются вьюпортом; текст «Level up! … Level {n}».
- Уровень 10: текст «{skill} mastered!», грандиознее звук (`grand`).
- Escape / клик по фону / кнопка CTA — закрывают; фокус на CTA при открытии; Tab заперт внутри; `role="dialog" aria-modal aria-labelledby`.
- prefers-reduced-motion: НЕТ тряски и волн конфетти, модалка просто появляется, звук играет.
- Ширины 375 / 768 / 1440: карточка `max-w-24rem w-full` с padding оверлея 1.5rem — не выходит за край, конфетти не даёт горизонтального скролла (overlay `overflow:hidden`).
- Проверка на реалистичном контенте: длинное имя навыка (vocabulary/listening) не ломает карточку (перенос, не обрезка).

Гейт: `pnpm build && pnpm lint` (по своей зоне) ДО отчёта.

---

## 7. Проверка frontend-ui-design-reviewer — добавлено 6 пунктов

План прогнан по чеклисту; вшиты явные инструкции по релевантным классам:
- **#4/#16 Конфликт fixed-зон + z-index:** явная карта слоёв (контент < тост `z-[1000]` < celebration `z-index:1100`); зафиксировано известное поведение error-тоста при откате (§0.1, §5).
- **#3/#8 Обрезанные поповеры/клип:** overlay `overflow:hidden` + конфетти `pointer-events:none` + требование «нет горизонтального скролла на 375» в критериях.
- **#6 Молчаливые действия:** закрытие — по трём триггерам с мгновенной реакцией; открытие — burst+звук+модалка <200ms.
- **#13 A11y:** `role/aria-modal/aria-labelledby`, focus на CTA, Tab-trap, Escape, prefers-reduced-motion (движение off, звук on), медаль/иконка `aria-hidden`, CTA — настоящий `<button>` с текстом.
- **#11/#12 AI-slop / копирайт:** запрет фиолетово-циан градиентов — медаль/конфетти строго из duo-токенов (accent навыка + gold + green); трофей `lucide-react`, НЕ эмодзи; тексты конкретны про уровень и навык.
- **#18 Хрупкие анимации:** все на transform/opacity, 160–500ms, ease-out/cubic-bezier на вход; каждая объясняет состояние (появление/удар/разлёт); под reduce гасятся.
