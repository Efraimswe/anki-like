'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { fetchApi } from '@/lib/auth-client';
import { userKeys } from '@/lib/queries/user';
import type { User } from '@/types';
import { useTranslations } from 'next-intl';

export default function SettingsProfilePage() {
  const t = useTranslations('settings.profile');
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const updateProfile = useMutation({
    mutationFn: (name: string | null) =>
      fetchApi<User>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name }),
      }),
    onSuccess: (updated) => {
      updateUser(updated);
      queryClient.setQueryData(userKeys.me(), updated);
      setMessage(t('successMessage'));
    },
    onError: () => {
      setMessage(t('errorMessage'));
    },
  });

  async function handleSave() {
    setMessage('');
    updateProfile.mutate(displayName || null);
  }

  return (
    <div className="space-y-4">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) lg:hidden">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        {t('backButton')}
      </Link>
      <div className="max-w-4xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-(--color-text-primary) heading">{t('heading')}</h2>
          <p className="text-sm font-medium text-(--color-text-secondary)">{t('description')}</p>
        </div>
        <div className="premium-card rounded-[2rem] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-white bg-(--color-bg-page) shadow-lg dark:border-(--color-border)" />
                <button type="button" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent) text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-105" aria-label="Edit avatar placeholder">
                  <Pencil className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="grid flex-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('fullNameLabel')}</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} onFocus={() => setIsEditingName(true)} onBlur={() => { window.setTimeout(() => setIsEditingName(false), 120); }} className="w-full rounded-xl border border-(--color-border) bg-white px-5 py-4 font-medium text-(--color-text-primary) outline-none transition-all focus:ring-2 focus:ring-(--color-accent-ring) dark:bg-(--color-bg-page)" placeholder={t('fullNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{t('emailLabel')}</label>
                <div className="w-full rounded-xl border border-(--color-border) bg-white px-5 py-4 font-medium text-(--color-text-secondary) dark:bg-(--color-bg-page)">{user?.email || ''}</div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-end">
            {message && <p className={`text-sm font-bold ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
            {isEditingName && (
              <button onClick={handleSave} disabled={updateProfile.isPending} className="button-primary px-10 py-3 shadow-xl shadow-orange-500/10">
                {updateProfile.isPending ? t('savingButton') : t('updateButton')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
