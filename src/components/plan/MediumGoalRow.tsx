'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDeleteMediumGoal, useToggleMediumGoal, useUpdateMediumGoalTitle } from '@/hooks/use-plan';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GoalCheckbox from './GoalCheckbox';
import EditableGoalTitle from './EditableGoalTitle';
import type { PlanMediumGoal } from '@/types';

const DELETE_MS = 200;

interface Props {
  bigGoalId: string;
  medium: PlanMediumGoal;
}

export default function MediumGoalRow({ medium }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'deleting'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMed = useToggleMediumGoal();
  const deleteMed = useDeleteMediumGoal();
  const updateTitle = useUpdateMediumGoalTitle();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    setPhase('deleting');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = setTimeout(() => {
      deleteMed.mutate(medium.id);
    }, reduce ? 0 : DELETE_MS);
  };

  return (
    <li className="plan-substep" data-phase={phase}>
      <div className="plan-substep-row">
        <div className="plan-substep-row-top">
          <GoalCheckbox
            checked={medium.completed}
            onToggle={() => toggleMed.mutate({ id: medium.id, completed: !medium.completed })}
            accent="var(--duo-green)"
            size="sm"
          />
          <EditableGoalTitle
            value={medium.title}
            completed={medium.completed}
            className="plan-substep-title"
            ariaLabel="Rename step"
            onSave={(title) => updateTitle.mutate({ id: medium.id, title })}
          />
        </div>
        {(
          <div className="plan-substep-row-meta">
            <button
              type="button"
              className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--danger"
              aria-label="Delete step"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-[15px] w-[15px]" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete step?"
          message="Do you really want to delete this step?"
          confirmLabel="Yes"
          cancelLabel="No"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </li>
  );
}
