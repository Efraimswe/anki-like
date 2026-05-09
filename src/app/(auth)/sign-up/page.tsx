'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

export default function SignUpPage() {
  const t = useTranslations('auth.signUp');
  const tErr = useTranslations('auth.errors');
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) router.push('/decks');
  }, [user, router]);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = tErr('emailRequired');
    else if (!EMAIL_RE.test(email.trim())) errs.email = tErr('emailInvalid');
    if (!password) errs.password = tErr('passwordRequired');
    else if (password.length < 8) errs.password = tErr('passwordTooShort');
    else if (!/[A-Z]/.test(password)) errs.password = tErr('passwordNeedsUppercase');
    else if (!/[0-9]/.test(password)) errs.password = tErr('passwordNeedsDigit');
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const errs = validate();
    setFieldErrors(errs);
    if (errs.email || errs.password) return;

    setLoading(true);
    try {
      await signUp(email, password);
      router.push('/decks');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const lower = msg.toLowerCase();
      if (lower.includes('already exists') || lower.includes('email')) {
        setFieldErrors({ email: tErr('emailTaken') });
      } else if (lower.includes('network') || lower.includes('fetch')) {
        setFormError(tErr('network'));
      } else {
        setFormError(msg || tErr('network'));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full px-5 py-4 bg-(--color-bg-page) rounded-[1.25rem] font-medium outline-none transition-all placeholder:text-(--color-text-tertiary)/50';
  const inputOk = 'focus:ring-2 focus:ring-(--color-accent-ring)';
  const inputErr =
    'ring-2 ring-red-400/70 focus:ring-2 focus:ring-red-400/70 placeholder:text-red-400/40';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF6] p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-(--color-accent) heading mb-8 tracking-tight">{t('title')}</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl text-sm font-medium"
              >
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mt-0.5 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{formError}</span>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1">{t('emailLabel')}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder={t('emailPlaceholder')}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((s) => ({ ...s, email: undefined }));
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`${inputBase} ${fieldErrors.email ? inputErr : inputOk}`}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-xs font-medium text-red-500 ml-1 mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1">{t('passwordLabel')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  placeholder={t('passwordPlaceholder')}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((s) => ({ ...s, password: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`${inputBase} pr-14 ${fieldErrors.password ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? tErr('hidePassword') : tErr('showPassword')}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-2 flex items-center justify-center w-10 rounded-full text-(--color-text-muted) hover:text-(--color-text-primary) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-ring) transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs font-medium text-red-500 ml-1 mt-1">{fieldErrors.password}</p>
              )}
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
