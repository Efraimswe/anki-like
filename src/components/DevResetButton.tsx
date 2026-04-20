'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function DevResetButton() {
  if (process.env.NODE_ENV !== 'development') return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const queryClient = useQueryClient();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleReset = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/dev/reset-onboarding', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/onboarding/step-1');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={status === 'loading'}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        padding: '6px 14px',
        borderRadius: 9999,
        border: '1.5px solid var(--color-accent)',
        background: 'var(--color-bg-surface)',
        color: status === 'error' ? '#dc2626' : 'var(--color-accent)',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        opacity: status === 'loading' ? 0.6 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all 0.2s',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {status === 'loading' ? 'Resetting…' : status === 'error' ? '✗ Reset failed' : '↩ Reset onboarding'}
    </button>
  );
}
