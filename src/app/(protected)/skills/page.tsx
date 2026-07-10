'use client';

import Link from 'next/link';
import { SKILL_CODES } from '@/lib/skills';
import { useSkills } from '@/hooks/use-skills';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkillCard from '@/components/skills/SkillCard';

export default function SkillsPage() {
  const { data, isPending, isError, refetch } = useSkills();

  if (isError) {
    return <ErrorMessage message="Couldn’t load your skills" onRetry={() => refetch()} />;
  }

  if (isPending || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--ink)' }}>
          Skills
        </h1>
        <p className="mt-1 text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
          Six skills, ten levels each. Complete them in order.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_CODES.map((code) => (
          <Link key={code} href={`/skills/${code}`} className="block">
            <SkillCard code={code} progress={data.progress[code]} />
          </Link>
        ))}
      </div>
    </div>
  );
}
