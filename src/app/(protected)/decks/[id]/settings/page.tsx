'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/hooks/use-auth';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { DeckFsrsConfig, DeckFsrsOptimizationResult } from '@/types';
import { useTranslations } from 'next-intl';

export default function DeckFsrsSettingsPage() {
  const t = useTranslations('fsrs');
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
      setMessage(t('optimizeSuccess', { reviewCount: result.reviewCount, cardCount: result.cardCount }));
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
        {t('backButton')}
      </Link>

      <div className="premium-card space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold heading text-(--color-text-primary)">{t('heading')}</h1>
          <p className="text-sm text-(--color-text-secondary)">{t('description')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('desiredRetention')}</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{Math.round(config.desiredRetention * 100)}%</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('maximumInterval')}</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{config.maximumInterval}d</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('parameterSource')}</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">{config.isOptimized ? t('sourceOptimized') : t('sourceDefault')}</p>
          </div>
          <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('lastOptimization')}</p>
            <p className="mt-2 text-sm font-bold text-(--color-text-primary)">
              {config.lastOptimizedAt ? new Date(config.lastOptimizedAt).toLocaleString() : t('never')}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-(--color-border) bg-(--color-bg-page) p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('weightsLabel')}</p>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            {config.weights.length ? t('weightsCount', { count: config.weights.length }) : t('defaultWeights')}
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
            {optimizing ? t('optimizing') : t('optimizeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
