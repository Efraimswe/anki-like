'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useCreateMediumGoal } from '@/hooks/use-plan';

interface Props {
  bigGoalId: string;
  onDone: () => void;
}

export default function AddMediumInput({ bigGoalId, onDone }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateMediumGoal();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    create.mutate({ bigGoalId, title: t });
    onDone();
  };

  return (
    <div className="plan-add-input">
      <Plus className="plan-add-input-plus" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        className="plan-input"
        placeholder="New step…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onDone();
        }}
      />
      <div className="plan-add-input-actions">
        <button
          type="button"
          className="goal-icon-btn goal-icon-btn--sm goal-icon-btn--confirm"
          aria-label="Create step"
          disabled={!value.trim()}
          onClick={submit}
        >
          <Check className="h-[15px] w-[15px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="goal-icon-btn goal-icon-btn--sm"
          aria-label="Cancel"
          onClick={onDone}
        >
          <X className="h-[15px] w-[15px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
