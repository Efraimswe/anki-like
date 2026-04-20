'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeoSide } from '@/components/onboarding/LeoSide';
import { GoalsForm } from '@/components/onboarding/GoalsForm';
import type { GoalsPayload } from '@/lib/onboarding/goals';
import { useTranslations } from 'next-intl';
import { readDraft, writeDraft } from '@/lib/onboarding/clientState';

export default function Step3Page() {
  const t = useTranslations('onboarding.step3');
  const router = useRouter();
  const [initialGoals] = useState<GoalsPayload | null>(() => readDraft().goals ?? null);

  const handleSubmit = (goals: GoalsPayload) => {
    writeDraft({ goals });
    router.push('/onboarding/step-4');
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

        <GoalsForm
          initialValue={initialGoals}
          onSubmit={handleSubmit}
          isSubmitting={false}
        />
      </div>
    </div>
  );
}
