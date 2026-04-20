'use client';

import { LEVEL_DATA, LEVEL_GROUPS, type Level, type LevelGroup } from '@/lib/onboarding/levels';
import { useTranslations } from 'next-intl';

interface LevelPickerProps {
  value: Level | null;
  onChange: (level: Level) => void;
}

export function LevelPicker({ value, onChange }: LevelPickerProps) {
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
