'use client';

import { useState } from 'react';
import type { GoalsPayload } from '@/lib/onboarding/goals';
import { useTranslations } from 'next-intl';

const PRIMARY_MAX = 120;

interface GoalsFormProps {
  initialValue: GoalsPayload | null;
  onSubmit: (g: GoalsPayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_KEYS = ['remoteJob', 'ielts', 'travel', 'shows', 'moveAbroad', 'readBooks', 'confident', 'friends'] as const;

export function GoalsForm({ initialValue, onSubmit, isSubmitting }: GoalsFormProps) {
  // i18n-keys: ["presets.remoteJob", "presets.ielts", "presets.travel", "presets.shows", "presets.moveAbroad", "presets.readBooks", "presets.confident", "presets.friends"]
  const t = useTranslations('onboarding.goals');
  const [primary, setPrimary] = useState(initialValue?.primary ?? '');
  const [touched, setTouched] = useState(false);

  const primaryTrimmed = primary.trim();
  const primaryError = touched && !primaryTrimmed;

  const handlePresetClick = (preset: string) => {
    setPrimary(preset === primaryTrimmed ? '' : preset);
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!primaryTrimmed) return;

    await onSubmit({ primary: primaryTrimmed });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Primary goal input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {t('primaryGoalLabel')} <span style={{ color: 'var(--color-accent)' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={primary}
            onChange={(e) => setPrimary(e.target.value.slice(0, PRIMARY_MAX))}
            onBlur={() => setTouched(true)}
            placeholder={t('primaryGoalPlaceholder')}
            style={{
              width: '100%',
              padding: '11px 14px',
              paddingRight: 48,
              borderRadius: 12,
              border: primaryError
                ? '1.5px solid var(--color-danger, #ef4444)'
                : '1.5px solid var(--color-border)',
              outline: 'none',
              fontSize: '0.9rem',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.7rem',
              color: primaryTrimmed.length > PRIMARY_MAX * 0.85
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {primaryTrimmed.length}/{PRIMARY_MAX}
          </span>
        </div>
        {primaryError && (
          <span style={{ fontSize: '0.78rem', color: 'var(--color-danger, #ef4444)' }}>
            {t('primaryGoalError')}
          </span>
        )}
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {t('quickPicksLabel')}
        </span>
        <div className="onb-goal-chips">
          {PRESET_KEYS.map((key) => {
            const preset = t(`presets.${key}`);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`onb-goal-chip${preset === primaryTrimmed ? ' is-primary' : ''}`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

    </div>

      {/* Continue CTA — outside scroll area so it's always visible */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !primaryTrimmed}
        style={{
          alignSelf: 'flex-end',
          flexShrink: 0,
          marginTop: 12,
          padding: '13px 32px',
          borderRadius: 9999,
          border: 'none',
          background: isSubmitting || !primaryTrimmed ? 'var(--color-bg-muted)' : 'var(--color-accent)',
          color: isSubmitting || !primaryTrimmed ? 'var(--color-text-muted)' : '#fff',
          fontWeight: 700,
          fontSize: '0.95rem',
          cursor: isSubmitting || !primaryTrimmed ? 'not-allowed' : 'pointer',
          boxShadow: isSubmitting || !primaryTrimmed ? 'none' : 'var(--shadow-cta)',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {isSubmitting ? t('savingButton') : t('continueButton')}
      </button>
    </div>
  );
}
