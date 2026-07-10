'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isSkillCode } from '@/lib/skills';
import { useSkillMutation, useSkills } from '@/hooks/use-skills';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkillLadder from '@/components/skills/SkillLadder';

export default function SkillPage() {
  const { skill } = useParams<{ skill: string }>();
  const [peek, setPeek] = useState(false);
  const { data, isPending, isError, refetch } = useSkills();
  const mutation = useSkillMutation();

  if (!isSkillCode(skill)) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <ErrorMessage message="Unknown skill" />
        <Link href="/skills" className="font-bold underline" style={{ color: 'var(--duo-blue)' }}>
          Back to skills
        </Link>
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Couldn’t load your skills" onRetry={() => refetch()} />;
  }

  if (isPending || !data) {
    return <LoadingSpinner />;
  }

  const pendingLevel = mutation.isPending ? (mutation.variables?.level ?? null) : null;

  return (
    <SkillLadder
      code={skill}
      completedLevel={data.progress[skill]}
      peek={peek}
      onTogglePeek={() => setPeek((p) => !p)}
      onComplete={(level) => mutation.mutate({ skill, level, action: 'complete' })}
      onUncomplete={(level) => mutation.mutate({ skill, level, action: 'uncomplete' })}
      pendingLevel={pendingLevel}
    />
  );
}
