'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { getLanguageByCode } from '@/lib/onboarding/languages';
import { useTranslations } from 'next-intl';
import { readDraft, clearDraft, type OnboardingDraft } from '@/lib/onboarding/clientState';

export default function Step4Page() {
  const t = useTranslations('onboarding.step4');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);

  useEffect(() => {
    setMounted(true);
    const d = readDraft();
    if (!d.nativeLanguage || !d.englishLevel || !d.goals) {
      router.replace('/onboarding/step-1');
      return;
    }
    setDraft(d);
  }, [router]);

  const handleComplete = async () => {
    if (isCompleting || !draft) return;
    setIsCompleting(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nativeLanguage: draft.nativeLanguage,
          englishLevel: draft.englishLevel,
          goals: draft.goals,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Something went wrong');
        return;
      }
      clearDraft();
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    } catch {
      alert('Failed to complete onboarding');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!draft) return null;

  const langCode = draft.nativeLanguage!;
  const nativeLang = getLanguageByCode(langCode)?.name ?? langCode;
  const nativeFlag = getLanguageByCode(langCode)?.flag ?? '';
  const level = draft.englishLevel!;
  const primaryGoal = draft.goals!.primary;

  const summaryCards = [
    { label: t('summaryNativeLanguage'), value: `${nativeFlag} ${nativeLang}`.trim(), icon: '🌍', bg: 'var(--chip-blue)', fg: 'var(--chip-blue-text)' },
    { label: t('summaryEnglishLevel'),   value: level,        icon: '📊', bg: 'var(--chip-purple)', fg: 'var(--chip-purple-text)' },
    { label: t('summaryMainGoal'),       value: primaryGoal,  icon: '🎯', bg: 'var(--chip-amber)',  fg: 'var(--chip-amber-text)' },
  ];

  return (
    <div
      className="onb-step4"
      style={{ animation: mounted ? 'fadeIn 400ms cubic-bezier(.2,.8,.2,1)' : 'none' }}
    >

      {/* Leo waving */}
      <div className="leo-float onb-leo-anchor">
        <Image
          src="/leo.png"
          alt="Leo - your English tutor"
          width={320}
          height={320}
          priority
        />
      </div>
      <div className="onb-leo-shadow onb-leo-shadow--lg" aria-hidden />

      {/* headline */}
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            margin: 0,
            color: 'var(--color-text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}
        >
          {t('headline')}
          <span style={{ color: 'var(--color-accent)' }}>.</span>
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-text-secondary)',
            margin: '12px 0 0',
            lineHeight: 1.6,
          }}
        >
          {t('sub')}
        </p>
      </div>

      {/* 3-card summary */}
      <div className="onb-summary-grid" style={{ width: '100%', maxWidth: 640 }}>
        {summaryCards.map(({ label, value, icon, bg, fg }) => (
          <div key={label} className="onb-summary-card">
            <div className="onb-summary-icon-tile" style={{ background: bg, color: fg }}>
              {icon}
            </div>
            <span className="onb-summary-label">{label}</span>
            <span className="onb-summary-value">{value}</span>
          </div>
        ))}
      </div>

      {/* XL CTA */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="onb-cta-xl"
      >
        {isCompleting ? t('starting') : t('cta')}
      </button>
    </div>
  );
}
