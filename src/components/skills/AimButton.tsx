'use client';

import { Target } from 'lucide-react';
import { useCreateBigGoal } from '@/hooks/use-plan';
import type { SkillCode } from '@/lib/skills';

interface Props {
  code: SkillCode;
  disabled: boolean;
}

export default function AimButton({ code, disabled }: Props) {
  const create = useCreateBigGoal();
  return (
    <button
      type="button"
      onClick={() => create.mutate(code)}
      disabled={disabled || create.isPending}
      aria-label={disabled ? 'Skill complete — nothing to aim for' : 'Aim for the next level'}
      className="goal-aim-btn"
    >
      <Target className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
