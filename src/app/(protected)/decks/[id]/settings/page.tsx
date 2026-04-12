'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/hooks/use-auth';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { DeckFsrsConfig, DeckFsrsOptimizationResult } from '@/types';

export default function DeckFsrsSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<DeckFsrsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchApi<DeckFsrsConfig>(`/api/decks/${id}/fsrs`)
      .then(setConfig)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleOptimize() {
    if (!id) return;
    setOptimizing(true);
    setError('');
    setMessage('');
    try {
      const result = await fetchApi<DeckFsrsOptimizationResult>(`/api/decks/${id}/fsrs/optimize`, { method: 'POST' });
      if (result.config) {
        setConfig(result.config);
      }
      setMessage(`Optimized from ${result.reviewCount} reviews across ${result.cardCount} cards.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error && !config) return <ErrorMessage message={error} />;
  if (!config) return <ErrorMessage message="FSRS config not found" />;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/decks/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary)">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to deck
      </Link>

      <div className="premium-card space-y-6 p-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-text-muted)">Deck scheduler</p>
          <h1 className="text-3xl font-bold heading text-(--color-text-primary)">FSRS Options</h1>
          <p className="text-sm text-(--color-text-secondary)">
            This deck uses the server-side FSRS scheduler. Review buttons render server-computed intervals, and optimization updates this deck&apos;s weights immediately.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Desired retention</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{Math.round(config.desiredRetention * 100)}%</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Maximum interval</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{config.maximumInterval}d</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Parameter source</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{config.isOptimized ? 'Optimized' : 'Default'}</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Last optimization</p>
            <p className="mt-2 text-sm font-bold text-(--color-text-primary)">
              {config.lastOptimizedAt ? new Date(config.lastOptimizedAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Weights</p>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            {config.weights.length ? `${config.weights.length} FSRS parameters stored for this deck.` : 'Using default Anki-style FSRS parameters.'}
          </p>
        </div>

        {message ? <p className="text-sm font-bold text-green-600">{message}</p> : null}
        {error ? <p className="text-sm font-bold text-red-500">{error}</p> : null}

        <div className="flex justify-end">
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="button-primary px-8 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {optimizing ? 'Optimizing...' : 'Optimize for This Deck'}
          </button>
        </div>
      </div>
    </div>
  );
}
