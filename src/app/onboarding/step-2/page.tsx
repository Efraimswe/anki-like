'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeoSide } from '@/components/onboarding/LeoSide';
import { LevelPicker } from '@/components/onboarding/LevelPicker';
import type { Level } from '@/lib/onboarding/levels';
import { useTranslations } from 'next-intl';
import { readDraft, writeDraft } from '@/lib/onboarding/clientState';

export default function Step2Page() {
  const t = useTranslations('onboarding.step2');
  const router = useRouter();
  const [level, setLevel] = useState<Level | null>(null);

  useEffect(() => {
    const draft = readDraft();
    if (draft.englishLevel) setLevel(draft.englishLevel);
  }, []);

  const handleContinue = () => {
    if (!level) return;
    writeDraft({ englishLevel: level });
    router.push('/onboarding/step-3');
  };

  const levelExtra = level ? (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--color-accent-muted)',
        border: '1px solid var(--color-accent)',
        borderRadius: 9999,
        padding: '4px 14px',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--color-accent)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {level}
    </div>
  ) : null;

  return (
    <div className="onb-panel">
      <LeoSide
        speech={t('leoSpeech')}
        extra={levelExtra}
      />

      <div className="onb-panel-content">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            {t('description')}
          </p>
        </div>

        <LevelPicker value={level} onChange={setLevel} />

        <button
          onClick={handleContinue}
          disabled={!level}
          style={{
            alignSelf: 'flex-end',
            padding: '13px 32px',
            borderRadius: 9999,
            border: 'none',
            background: level ? 'var(--color-accent)' : 'var(--color-bg-muted)',
            color: level ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: !level ? 'not-allowed' : 'pointer',
            boxShadow: level ? 'var(--shadow-cta)' : 'none',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {t('continueButton')}
        </button>
      </div>
    </div>
  );
}
