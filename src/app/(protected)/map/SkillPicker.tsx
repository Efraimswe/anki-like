'use client';

import { useEffect, useRef } from 'react';
import type { SkillName } from '@/types/skillMap';

const SKILLS: { name: SkillName; hex: string }[] = [
  { name: 'Reading',   hex: '#C7D2FE' },
  { name: 'Listening', hex: '#99F6E4' },
  { name: 'Writing',   hex: '#FECDD3' },
  { name: 'Speaking',  hex: '#FDE68A' },
];

interface SkillPickerProps {
  screenX: number;
  screenY: number;
  onPick: (name: SkillName) => void;
  onClose: () => void;
}

export default function SkillPicker({ screenX, screenY, onPick, onClose }: SkillPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    // Defer mousedown listener so the click that opened the picker doesn't immediately close it.
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
        minWidth: 168,
      }}
    >
      {SKILLS.map(({ name, hex }) => (
        <button
          key={name}
          onClick={() => onPick(name)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
            style={{ background: hex }}
          />
          {name}
        </button>
      ))}
    </div>
  );
}
