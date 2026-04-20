'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

export default function SignUpPage() {
  const t = useTranslations('auth.signUp');
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push('/decks');
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('passwordError'));
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      router.push('/decks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page) p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="premium-card p-6 md:p-10 shadow-2xl border-none">
          <h2 className="text-2xl md:text-3xl font-extrabold text-(--color-accent) heading mb-8 tracking-tight">{t('title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1">{t('emailLabel')}</label>
              <input id="email" type="email" required value={email} placeholder={t('emailPlaceholder')} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-(--color-bg-page) border border-(--color-border) rounded-[1.25rem] font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all placeholder:text-(--color-text-tertiary)/50" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1">{t('passwordLabel')}</label>
              <input id="password" type="password" required minLength={8} value={password} placeholder={t('passwordPlaceholder')} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-(--color-bg-page) border border-(--color-border) rounded-[1.25rem] font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all placeholder:text-(--color-text-tertiary)/50" />
            </div>
            <button type="submit" disabled={loading} className="button-primary w-full py-4 text-lg mt-4 shadow-xl shadow-orange-500/20 active:scale-95 transition-transform">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t('creatingAccount')}
                </span>
              ) : t('submitButton')}
            </button>
          </form>
          <div className="mt-10 pt-8 border-t border-(--color-border) text-center">
            <p className="text-sm font-medium text-(--color-text-secondary)">
              {t('hasAccount')}{' '}
              <Link href="/sign-in" className="text-(--color-accent) font-bold hover:underline ml-1">{t('signInLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
