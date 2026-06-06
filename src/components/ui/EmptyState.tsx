'use client';

import Owl from '@/components/ui/Owl';

interface Props {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div
      className="flex flex-col items-center rounded-3xl border-2 border-dashed p-10 text-center"
      style={{ borderColor: 'var(--rule)', background: 'var(--surface)' }}
    >
      <Owl size={80} />
      <h3 className="font-display mt-4 text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm font-bold" style={{ color: 'var(--ink-muted)' }}>{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="button-primary mt-6">
          {action.label}
        </button>
      )}
    </div>
  );
}
