'use client';

import { LEVEL_DATA, LEVEL_GROUPS, type Level, type LevelGroup } from '@/lib/onboarding/levels';
import { useTranslations } from 'next-intl';

interface LevelPickerProps {
  value: Level | null;
  onChange: (level: Level) => void;
}

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  // i18n-keys: ["groups.Beginner", "groups.Intermediate", "groups.Advanced", "groups.Fluent"]
  // i18n-keys: ["A1.title", "A1.desc", "A1 solid.title", "A1 solid.desc"]
  // i18n-keys: ["A2.title", "A2.desc", "A2 solid.title", "A2 solid.desc"]
  // i18n-keys: ["B1.title", "B1.desc", "B1 solid.title", "B1 solid.desc"]
  // i18n-keys: ["B2.title", "B2.desc", "B2 solid.title", "B2 solid.desc"]
  // i18n-keys: ["C1.title", "C1.desc", "C1 solid.title", "C1 solid.desc"]
  // i18n-keys: ["C2.title", "C2.desc", "C2 solid.title", "C2 solid.desc"]
  // i18n-keys: ["Fluent.title", "Fluent.desc"]
  const t = useTranslations('onboarding.levels');
  return (
    <div className="onb-level-groups">
      {LEVEL_GROUPS.map((group: LevelGroup) => {
        const levels = LEVEL_DATA.filter((l) => l.group === group);
        return (
          <div key={group}>
            <div className="onb-level-group-header">{t(`groups.${group}`)}</div>
            <div className="onb-level-grid">
              {levels.map((level) => {
                const isSelected = value === level.code;
                return (
                  <button
                    key={level.code}
                    type="button"
                    onClick={() => onChange(level.code)}
                    className={`onb-level-card${isSelected ? ' selected' : ''}`}
                  >
                    <span className="onb-level-badge">{level.code}</span>
                    <span className="onb-level-sub">{t(`${level.code}.title`)}</span>
                    <span className="onb-level-desc">{t(`${level.code}.desc`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
