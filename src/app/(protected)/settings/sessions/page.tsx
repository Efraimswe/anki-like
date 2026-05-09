'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Session } from '@/types';
import { useTranslations } from 'next-intl';

export default function SettingsSessionsPage() {
  const t = useTranslations('settings.sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ sessions: Session[] }>('/api/sessions')
      .then((res) => setSessions(res.sessions))
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(id: string) {
    try {
      await fetchApi(`/api/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('Failed to revoke session', e);
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) lg:hidden">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        {t('backButton')}
      </Link>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-bold px-2 heading">{t('heading')}</h3>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="premium-card p-6 flex items-center justify-between border-none shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-(--color-bg-page) flex items-center justify-center text-2xl">
                    {session.deviceInfo?.toLowerCase().includes('phone') ? '📱' : '💻'}
                  </div>
                  <div>
                    <p className="font-bold text-(--color-text-primary) flex items-center gap-3">
                      {session.deviceInfo || t('authorizedDevice')}
                      {session.isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md">{t('activeNow')}</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider mt-1">
                      {session.ipAddress} &middot; {t('lastActive')} {new Date(session.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button onClick={() => handleRevoke(session.id)} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
                    {t('revokeButton')}
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="premium-card p-10 text-center text-(--color-text-muted) font-bold">{t('noSessions')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
