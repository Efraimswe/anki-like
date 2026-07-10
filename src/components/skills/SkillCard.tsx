import Link from 'next/link';
import { SKILLS, skillLevelText, type SkillCode } from '@/lib/skills';
import { SKILL_META } from './skill-meta';
import AimButton from './AimButton';

interface Props {
  code: SkillCode;
  progress: number;
}

export default function SkillCard({ code, progress }: Props) {
  const { Icon, accent } = SKILL_META[code];
  const name = SKILLS[code].name;
  const pct = Math.min(100, Math.max(0, progress * 10));
  const mastered = progress >= 10;

  return (
    <div className="premium-card relative p-5 transition-colors hover:bg-(--surface-hover)">
      <Link href={`/skills/${code}`} className="block">
        <div className="flex items-center gap-3 pr-12">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <h3 className="font-display truncate text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
            {name}
          </h3>
        </div>

        <p className="mt-3 text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
          {progress === 0 ? 'Not started' : `Level ${progress} of 10`}
        </p>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--rule)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
        </div>

        <p className="mt-3 text-sm" style={{ color: 'var(--ink-muted)' }}>
          {progress < 10 ? skillLevelText(code, progress + 1) : 'All levels complete'}
        </p>
      </Link>
      <AimButton code={code} disabled={mastered} />
    </div>
  );
}
