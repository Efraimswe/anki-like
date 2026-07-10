'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trophy } from 'lucide-react';

interface Props {
  level: number;
  skillName: string;
  accent: string; // SKILL_META[code].accent, e.g. 'var(--duo-green)'
  isMastery: boolean; // level === MAX_LEVEL
  reduceMotion: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function LevelCelebration({
  level,
  skillName,
  accent,
  isMastery,
  reduceMotion,
  onClose,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the CTA when the celebration opens.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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
    <div className="level-celebration-overlay" onClick={onClose}>
      {!reduceMotion && (
        <div className="level-celebration-confetti" aria-hidden="true">
          {[0, 1, 2].map((wave) =>
            Array.from({ length: 8 }).map((_, i) => (
              <span
                key={`${wave}-${i}`}
                style={
                  {
                    '--a': `${i * 45 + wave * 15}deg`,
                    '--d': `${wave * 180}ms`, // "boom-boom-ka-boom" — three waves
                    '--c': [accent, 'var(--duo-gold)', 'var(--duo-green)'][wave],
                  } as React.CSSProperties
                }
              />
            )),
          )}
        </div>
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        className={`premium-card level-celebration-card${reduceMotion ? '' : ' is-shaking'}`}
        style={{ '--accent': accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="level-celebration-medal" aria-hidden="true">
          <Trophy strokeWidth={2.5} />
        </span>
        <h2 id="celebration-title" className="font-display">
          {title}
        </h2>
        <p>{body}</p>
        <button ref={closeRef} type="button" onClick={onClose} className="button-primary w-full">
          {cta}
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
