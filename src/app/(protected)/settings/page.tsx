'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShieldCheck, UserRound, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { LANGUAGES } from '@/lib/onboarding/languages';
import { LOCALES } from '@/i18n/routing';

interface UserProfile {
  id: string;
  nativeLanguage?: string | null;
  interfaceLanguage?: string | null;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const queryClient = useQueryClient();

  const settingsLinks = [
    { href: '/settings/profile', label: t('profileLabel'), description: t('profileDescription'), Icon: UserRound },
    { href: '/settings/sessions', label: t('sessionsLabel'), description: t('sessionsDescription'), Icon: ShieldCheck },
  ];

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['user'],
    queryFn: () => fetchApi('/api/users/me'),
  });

  const updateLang = useMutation({
    mutationFn: (interfaceLanguage: string) =>
      fetchApi('/api/users/me', { method: 'PATCH', body: JSON.stringify({ interfaceLanguage }) }),
    onMutate: async (interfaceLanguage) => {
      await queryClient.cancelQueries({ queryKey: ['user'] });
      const previous = queryClient.getQueryData<UserProfile>(['user']);
      queryClient.setQueryData<UserProfile>(['user'], (old) =>
        old ? { ...old, interfaceLanguage } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['user'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.refresh();
    },
  });

  const nativeLang = user?.nativeLanguage ?? null;
  const currentInterface = user?.interfaceLanguage ?? nativeLang ?? 'en';
  const showToggle = nativeLang && nativeLang !== 'en';
  const usingEnglish = currentInterface === 'en';

  const [showDropdown, setShowDropdown] = useState(false);

  const handleToggle = () => {
    if (usingEnglish) {
      updateLang.mutate(nativeLang!);
    } else {
      updateLang.mutate('en');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {settingsLinks.map((link) => (
        <Link key={link.href} href={link.href} className="group flex w-full items-center gap-4 rounded-[2rem] border border-(--color-border) bg-(--color-bg-surface) px-5 py-4 transition-all hover:border-(--color-border-strong) hover:bg-(--color-bg-surface-hover)">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--color-accent) text-white shadow-[0_14px_28px_-16px_rgba(242,91,57,0.55)] transition-shadow group-hover:shadow-[0_18px_34px_-16px_rgba(242,91,57,0.62)] dark:text-(--color-bg-page)">
            <link.Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-(--color-text-primary)">{link.label}</p>
            <p className="mt-1 text-xs font-medium text-(--color-text-tertiary)">{link.description}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}

      {/* Interface language card */}
      <div className="flex w-full items-start gap-4 rounded-[2rem] border border-(--color-border) bg-(--color-bg-surface) px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--color-accent) text-white shadow-[0_14px_28px_-16px_rgba(242,91,57,0.55)] dark:text-(--color-bg-page)">
          <Globe className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-(--color-text-primary)">{t('interfaceLanguageLabel')}</p>
            <p className="mt-1 text-xs font-medium text-(--color-text-tertiary)">{t('interfaceLanguageDescription')}</p>
          </div>

          {showToggle && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                disabled={updateLang.isPending}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-60 ${usingEnglish ? 'bg-(--color-accent)' : 'bg-(--color-bg-muted)'}`}
                role="switch"
                aria-checked={usingEnglish}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${usingEnglish ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm font-medium text-(--color-text-secondary)">{t('useEnglishToggle')}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="text-xs font-bold text-(--color-accent) hover:underline"
            >
              {t('chooseLanguage')} ({LANGUAGES.find((l) => l.code === currentInterface)?.nativeName ?? currentInterface})
            </button>
          </div>

          {showDropdown && (
            <select
              value={currentInterface}
              onChange={(e) => { updateLang.mutate(e.target.value); setShowDropdown(false); }}
              className="w-full bg-(--color-bg-page) border border-(--color-border) rounded-xl px-3 py-2 text-sm font-medium outline-none cursor-pointer"
              size={6}
            >
              {LOCALES.map((code) => {
                const lang = LANGUAGES.find((l) => l.code === code);
                return (
                  <option key={code} value={code}>
                    {lang ? `${lang.flag} ${lang.nativeName}` : code.toUpperCase()}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
