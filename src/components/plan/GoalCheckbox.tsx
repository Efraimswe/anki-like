'use client';

import { Check } from 'lucide-react';

interface Props {
  checked: boolean;
  onToggle: () => void;
  accent: string;
  size?: 'sm' | 'md';
}

export default function GoalCheckbox({ checked, onToggle, accent, size = 'md' }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Mark as not done' : 'Mark as done'}
      onClick={onToggle}
      className={`goal-checkbox${size === 'sm' ? ' goal-checkbox--sm' : ''}${checked ? ' pop' : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {checked && (
        <Check className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={3} aria-hidden="true" />
      )}
    </button>
  );
}
