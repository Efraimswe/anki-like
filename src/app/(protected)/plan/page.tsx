'use client';

import Link from 'next/link';
import { Target } from 'lucide-react';
import { usePlanGoals } from '@/hooks/use-plan';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PlanGoalCard from '@/components/plan/PlanGoalCard';

export default function PlanPage() {
  const { data, isPending, isError, refetch } = usePlanGoals();

  if (isError) {
    return <ErrorMessage message="Couldn’t load your plan" onRetry={() => refetch()} />;
  }

  if (isPending || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--ink)' }}>
          Plan
        </h1>
        <p className="mt-1 text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
          Aim for a level, then break it into steps.
        </p>
      </div>

      {data.goals.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'var(--paper-soft)', color: 'var(--ink-soft)' }}
          >
            <Target className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-extrabold" style={{ color: 'var(--ink)' }}>
            No goals yet
          </h2>
          <p className="text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>
            Go to Skills and tap the target on any skill to aim for your next level.
          </p>
          <Link href="/skills" className="button-ghost">
            Go to Skills
          </Link>
        </div>
      ) : (
        <ul className="plan-list">
          {data.goals.map((g) => (
            <PlanGoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}
