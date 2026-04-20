'use client';

import { usePathname } from 'next/navigation';

export default function StepDots() {
  const pathname = usePathname();
  const stepMatch = pathname.match(/step-(\d)/);
  const current = stepMatch ? parseInt(stepMatch[1], 10) : 1;

  return (
    <div
      className="fixed bottom-6 left-0 right-0 flex justify-center gap-2 z-50"
    >
      {[1, 2, 3, 4].map((n) => {
        const isActive = n === current;
        const isPast = n < current;
        return (
          <div
            key={n}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 9999,
              background: isActive
                ? 'var(--color-accent)'
                : isPast
                ? 'var(--color-text-secondary)'
                : 'var(--color-muted-strong)',
              transition: 'width 300ms ease, background 300ms ease',
            }}
          />
        );
      })}
    </div>
  );
}
