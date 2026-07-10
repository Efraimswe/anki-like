'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, Lock } from 'lucide-react';
import { MAX_LEVEL, SKILLS, skillLevelText, type SkillCode } from '@/lib/skills';
import { SKILL_META } from './skill-meta';
import LevelCelebration from './LevelCelebration';
import { playCelebration } from '@/lib/celebration-sound';

interface Props {
  code: SkillCode;
  completedLevel: number;
  peek: boolean;
  onTogglePeek: () => void;
  onComplete: (level: number) => void;
  onUncomplete: (level: number) => void;
  pendingLevel: number | null;
}

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

export default function SkillLadder({
  code,
  completedLevel,
  peek,
  onTogglePeek,
  onComplete,
  onUncomplete,
  pendingLevel,
}: Props) {
  const { Icon, accent } = SKILL_META[code];
  const name = SKILLS[code].name;
  const isGold = accent === 'var(--duo-gold)';

  const prevCompleted = useRef(completedLevel);
  const [burstLevel, setBurstLevel] = useState<number | null>(null);
  const [celebrateLevel, setCelebrateLevel] = useState<number | null>(null);
  useEffect(() => {
    const prev = prevCompleted.current;
    prevCompleted.current = completedLevel;
    if (completedLevel > prev) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) setBurstLevel(completedLevel);
      setCelebrateLevel(completedLevel); // celebration modal always shows (reduce → fade only)
      playCelebration({ grand: completedLevel === MAX_LEVEL });
    }
  }, [completedLevel]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
              {name}
            </h1>
            <p className="text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
              Level {completedLevel} of 10
            </p>
          </div>
        </div>
        <button type="button" onClick={onTogglePeek} aria-pressed={peek} className="button-ghost self-start sm:self-auto">
          {peek ? 'Hide upcoming' : 'Peek ahead'}
        </button>
      </div>

      <ol className="skill-path">
        {LEVELS.map((n) => {
          const completed = n <= completedLevel;
          const current = n === completedLevel + 1;
          const locked = n > completedLevel + 1;
          const isTopCompleted = completed && n === completedLevel;
          const pending = pendingLevel === n;
          const side = n % 2 === 0 ? 'left' : 'right';
          const isBursting = burstLevel === n;

          const nodeClassName = [
            'skill-path-node',
            completed && 'is-completed',
            current && 'is-current',
            locked && 'is-locked',
            isBursting && 'is-burst',
          ]
            .filter(Boolean)
            .join(' ');

          const contentColor = isGold && (completed || current) ? 'var(--owl-ink)' : undefined;

          return (
            <li key={n} className="skill-path-row" data-side={side}>
              {current && <span className="skill-path-here">You&rsquo;re here</span>}

              <div className="skill-path-node-wrap">
                <div className={nodeClassName} style={{ '--accent': accent } as CSSProperties}>
                  {completed && (
                    <Check
                      className="h-6 w-6"
                      strokeWidth={3}
                      style={{ color: contentColor }}
                      aria-label={`Level ${n} completed`}
                    />
                  )}
                  {current && (
                    <span className="text-xl font-extrabold" style={{ color: contentColor }}>
                      {n}
                    </span>
                  )}
                  {locked && <Lock className="h-5 w-5" aria-hidden="true" />}

                  {isBursting && (
                    <span className="skill-burst" aria-hidden="true" onAnimationEnd={() => setBurstLevel(null)}>
                      <span className="skill-burst-ring" />
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className="skill-burst-dot" style={{ '--a': `${i * 45}deg` } as CSSProperties} />
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {current && (
                <div className="premium-card skill-path-bubble p-4 text-center">
                  <p className="text-sm" style={{ color: 'var(--ink)' }}>
                    {skillLevelText(code, n)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onComplete(n)}
                    disabled={pending}
                    className="button-primary mt-3 w-full"
                  >
                    {pending ? 'Saving…' : 'Mark as complete'}
                  </button>
                </div>
              )}

              {completed && (
                <div className="flex flex-col items-center gap-1">
                  <p className="skill-path-caption text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {skillLevelText(code, n)}
                  </p>
                  {isTopCompleted && (
                    <button
                      type="button"
                      onClick={() => onUncomplete(n)}
                      disabled={pending}
                      className="button-ghost text-sm"
                      style={{ minHeight: 44 }}
                    >
                      Mark as not done
                    </button>
                  )}
                </div>
              )}

              {locked && !peek && (
                <p className="text-sm font-bold" style={{ color: 'var(--ink-soft)' }}>
                  <span
                    className="inline-flex items-center gap-1.5"
                    aria-label="Locked — complete previous levels first"
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Locked
                  </span>
                </p>
              )}
              {locked && peek && (
                <p className="skill-path-caption text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {skillLevelText(code, n)}
                </p>
              )}
            </li>
          );
        })}
      </ol>

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
    </div>
  );
}
