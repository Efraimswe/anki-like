'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useDeleteBigGoal, useToggleBigGoal, useUpdateBigGoalTitle } from '@/hooks/use-plan';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GoalCheckbox from './GoalCheckbox';
import EditableGoalTitle from './EditableGoalTitle';
import MediumGoalRow from './MediumGoalRow';
import AddMediumInput from './AddMediumInput';
import type { PlanBigGoal } from '@/types';

const DELETE_MS = 220;

interface Props {
  goal: PlanBigGoal;
}

export default function PlanGoalCard({ goal }: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleBig = useToggleBigGoal();
  const deleteBig = useDeleteBigGoal();
  const updateTitle = useUpdateBigGoalTitle();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    setDeleting(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = setTimeout(() => {
      deleteBig.mutate(goal.id);
    }, reduce ? 0 : DELETE_MS);
  };

  const total = goal.mediumGoals.length;
  const done = goal.mediumGoals.filter((m) => m.completed).length;

  return (
    <li className="plan-goal" data-done={goal.completed || undefined} data-deleting={deleting || undefined}>
      <div className="plan-goal-collapse" data-open={!deleting}>
        <div className="plan-goal-collapse-inner">

          {/* PARENT ROW */}
          <div className="plan-goal-head">
            <div className="plan-goal-head-top">
              <button
                type="button"
                className="plan-disclosure"
                aria-expanded={open}
                aria-label={open ? 'Collapse steps' : 'Expand steps'}
                onClick={() => setOpen((v) => !v)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <GoalCheckbox
                checked={goal.completed}
                onToggle={() => toggleBig.mutate({ id: goal.id, completed: !goal.completed })}
                accent="var(--duo-green)"
              />
              <EditableGoalTitle
                value={goal.title}
                completed={goal.completed}
                className="plan-goal-title font-display"
                ariaLabel="Rename goal"
                onSave={(title) => updateTitle.mutate({ id: goal.id, title })}
              />
            </div>
            {(
              <div className="plan-goal-head-meta">
                {total > 0 && <span className="plan-goal-count">{done}/{total}</span>}
                <div className="plan-goal-actions">
                  <button
                    type="button"
                    className="goal-icon-btn goal-icon-btn--danger"
                    aria-label="Delete goal"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BODY */}
          <div className="plan-goal-body" data-open={open}>
            <div className="plan-goal-body-inner">
              <ul className="plan-substeps">
                {goal.mediumGoals.map((m) => (
                  <MediumGoalRow key={m.id} bigGoalId={goal.id} medium={m} />
                ))}
              </ul>
              {adding ? (
                <AddMediumInput bigGoalId={goal.id} onDone={() => setAdding(false)} />
              ) : (
                <button type="button" className="plan-add-step" onClick={() => setAdding(true)}>
                  <Plus aria-hidden="true" /> Add step
                </button>
              )}
            </div>
          </div>

          {confirmDelete && (
            <ConfirmDialog
              title="Delete goal?"
              message="Do you really want to delete this goal?"
              confirmLabel="Yes"
              cancelLabel="No"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={handleConfirmDelete}
            />
          )}
        </div>
      </div>
    </li>
  );
}
