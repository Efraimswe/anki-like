'use client';

import { usePathname } from 'next/navigation';

export default function ProgressChrome() {
  const pathname = usePathname();
  const stepMatch = pathname.match(/step-(\d)/);
  const step = stepMatch ? parseInt(stepMatch[1], 10) : 1;
  const pct = (step / 4) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* top bar */}
      <div
        style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}
        className="flex items-center justify-between px-6 h-12"
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
          Anki-Like
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Step {step} of 4
        </span>
      </div>
      {/* progress track */}
      <div style={{ height: 3, background: 'var(--color-border)' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--color-accent)',
            transition: 'width 500ms cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>
    </div>
  );
}
