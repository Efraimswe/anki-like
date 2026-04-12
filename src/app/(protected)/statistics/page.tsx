'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statisticsOptions } from '@/lib/queries/statistics';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function StatisticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { data: stats, isPending, isError, error, refetch } = useQuery(statisticsOptions(period));

  if (isPending) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load statistics'} onRetry={() => refetch()} />;
  if (!stats) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold heading">Statistics</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === p ? 'bg-(--color-accent) text-white' : 'bg-(--color-bg-surface) text-(--color-text-secondary) hover:bg-(--color-bg-surface-hover)'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card p-6 text-center">
          <p className="text-3xl font-bold text-(--color-accent)">{stats.totalReviews}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mt-2">Reviews</p>
        </div>
        <div className="premium-card p-6 text-center">
          <p className="text-3xl font-bold text-(--color-success)">{stats.accuracyPercent}%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mt-2">Accuracy</p>
        </div>
        <div className="premium-card p-6 text-center">
          <p className="text-3xl font-bold text-(--color-text-primary)">{stats.retentionRate}%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mt-2">Retention</p>
        </div>
        <div className="premium-card p-6 text-center">
          <p className="text-3xl font-bold text-(--color-text-primary)">{stats.totalTimeMinutes}m</p>
          <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mt-2">Study Time</p>
        </div>
      </div>

      {stats.dailyBreakdown.length > 0 && (
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold heading mb-4">Daily Breakdown</h3>
          <div className="space-y-3">
            {stats.dailyBreakdown.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-(--color-border) last:border-0">
                <span className="text-sm font-bold text-(--color-text-secondary)">{day.date}</span>
                <div className="flex gap-6 text-sm">
                  <span className="font-bold">{day.reviews} reviews</span>
                  <span className="text-(--color-success) font-bold">{day.accuracy}%</span>
                  <span className="text-(--color-text-muted)">{day.timeMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
