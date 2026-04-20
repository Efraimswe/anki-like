'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeoSide } from '@/components/onboarding/LeoSide';
import { LanguagePicker } from '@/components/onboarding/LanguagePicker';
import { writeDraft, readDraft } from '@/lib/onboarding/clientState';

export default function Step1Page() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    const draftLang = readDraft().nativeLanguage;
    if (draftLang) setSelectedLanguage(draftLang);
  }, []);

  const handleContinue = () => {
    if (!selectedLanguage) return;
    writeDraft({ nativeLanguage: selectedLanguage });
    router.push('/onboarding/step-2');
  };

  return (
    <div className="onb-panel">
      <LeoSide speech="Hey! I'm Leo. I'll teach you English in a way that actually works." />

      <div className="onb-panel-content">
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {"What's your native language?"}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            {"We'll translate the UI and speak to you in this language."}
          </p>
        </div>

        <LanguagePicker onSelect={setSelectedLanguage} selectedCode={selectedLanguage} />

        <button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          style={{
            alignSelf: 'flex-end',
            padding: '13px 32px',
            borderRadius: 9999,
            border: 'none',
            background: selectedLanguage ? 'var(--color-accent)' : 'var(--color-bg-muted)',
            color: selectedLanguage ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: !selectedLanguage ? 'not-allowed' : 'pointer',
            boxShadow: selectedLanguage ? 'var(--shadow-cta)' : 'none',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
