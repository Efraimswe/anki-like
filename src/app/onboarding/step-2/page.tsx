'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeoSide } from '@/components/onboarding/LeoSide';
import { LEVELS, type Level } from '@/lib/onboarding/levels';
import { SKILL_KEYS, type SkillKey, type SkillLevels } from '@/lib/onboarding/skillLevels';
import { readDraft, writeDraft } from '@/lib/onboarding/clientState';
import { useTranslations } from 'next-intl';

export default function Step2Page() {
  const t = useTranslations('onboarding.step2');
  // i18n-keys: ["reading", "listening", "writing", "speaking", "placeholder"]
  const ts = useTranslations('onboarding.skills');
  const router = useRouter();
  const [skillLevels, setSkillLevels] = useState<Partial<SkillLevels>>({});

  useEffect(() => {
    const draft = readDraft();
    if (draft.skillLevels) setSkillLevels(draft.skillLevels);
  }, []);

  const allSelected = SKILL_KEYS.every((k) => skillLevels[k]);

  const handlePick = (key: SkillKey, level: Level) => {
    setSkillLevels((prev) => ({ ...prev, [key]: level }));
  };

  const handleContinue = () => {
    if (!allSelected) return;
    writeDraft({ skillLevels });
    router.push('/onboarding/step-3');
  };

  return (
    <div className="onb-panel">
      <LeoSide speech={t('leoSpeech')} />

      <div className="onb-panel-content">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            {t('description')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {SKILL_KEYS.map((key) => (
            <div key={key}>
              <div style={{
                fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: 'var(--color-text-secondary)',
                marginBottom: 6,
              }}>
                {ts(key)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${LEVELS.length}, 1fr)`, gap: 6 }}>
                {LEVELS.map((level) => {
                  const active = skillLevels[key] === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handlePick(key, level)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 9999,
                        border: active ? '2px solid var(--color-accent)' : '1.5px solid var(--color-border)',
                        background: active ? 'var(--color-accent)' : 'var(--color-bg-surface)',
                        color: active ? '#fff' : 'var(--color-text-primary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer',
                        boxShadow: active ? 'var(--shadow-cta)' : 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!allSelected}
          style={{
            alignSelf: 'flex-end',
            padding: '13px 32px',
            borderRadius: 9999,
            border: 'none',
            background: allSelected ? 'var(--color-accent)' : 'var(--color-bg-muted)',
            color: allSelected ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: !allSelected ? 'not-allowed' : 'pointer',
            boxShadow: allSelected ? 'var(--shadow-cta)' : 'none',
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
