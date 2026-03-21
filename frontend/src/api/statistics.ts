import { api } from './client';
import type { Statistics, DailyLimits } from './types';

export function getStatistics(from?: string, to?: string): Promise<Statistics> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return api.get(`/statistics${qs ? `?${qs}` : ''}`);
}

export function getDailyLimits(): Promise<DailyLimits> {
  return api.get('/settings/daily-limits');
}

export function updateDailyLimits(data: { maxNewCards?: number; maxReviews?: number }): Promise<DailyLimits> {
  return api.patch('/settings/daily-limits', data);
}
