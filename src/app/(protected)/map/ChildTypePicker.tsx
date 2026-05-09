'use client';

import { useEffect, useRef } from 'react';

export type ChildType = 'subskill' | 'exercise';

interface ChildTypePickerProps {
  screenX: number;
  screenY: number;
  exerciseDisabled?: boolean;
  onPick: (type: ChildType) => void;
  onClose: () => void;
}

const OPTIONS: { type: ChildType; label: string; hint: string }[] = [
  { type: 'subskill', label: 'Subskill', hint: 'Group a topic further' },
  { type: 'exercise', label: 'Exercise', hint: 'Concrete practice item' },
];

export default function ChildTypePicker({
  screenX, screenY, exerciseDisabled = false, onPick, onClose,
}: ChildTypePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    const id = setTimeout(() => window.addEventListener('mousedown', onDown), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(id);
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 flex flex-col gap-1 p-2 rounded-2xl shadow-xl"
      style={{
        left: screenX + 12,
        top: screenY + 12,
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        minWidth: 200,
      }}
    >
      {OPTIONS.map(({ type, label, hint }) => {
        const disabled = type === 'exercise' && exerciseDisabled;
        return (
          <button
            key={type}
            disabled={disabled}
            onClick={() => onPick(type)}
            className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-left transition-colors
              ${disabled
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10'}`}
          >
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-[11px] opacity-70">
              {disabled ? 'Already exists' : hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
