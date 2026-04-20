'use client';

import { LANGUAGES, type Language } from '@/lib/onboarding/languages';

interface LanguagePickerProps {
  onSelect: (languageCode: string) => void;
  selectedCode?: string | null;
}

const CHIP_BG: Record<string, string> = {
  rose:   'var(--chip-rose)',
  blue:   'var(--chip-blue)',
  purple: 'var(--chip-purple)',
  amber:  'var(--chip-amber)',
  green:  'var(--chip-green)',
};

export function LanguagePicker({ onSelect, selectedCode }: LanguagePickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, gap: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          alignContent: 'start',
          padding: 4,
        }}
      >
        {LANGUAGES.map((lang: Language) => {
          const isSelected = selectedCode === lang.code;
          const flagBg = CHIP_BG[lang.chip ?? 'blue'];
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className={`onb-lang-card${isSelected ? ' selected' : ''}`}
            >
              <div
                className="onb-lang-flag"
                style={{ background: flagBg }}
              >
                {lang.flag}
              </div>
              <div className="onb-lang-names">
                <span className="onb-lang-name">{lang.name}</span>
                <span className="onb-lang-native">{lang.nativeName}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
