import type { GoalsPayload } from './goals';
import type { SkillLevels } from './skillLevels';

export interface OnboardingDraft {
  nativeLanguage?: string;
  skillLevels?: Partial<SkillLevels>;
  goals?: GoalsPayload;
}

const KEY = 'onboardingDraft';

export function readDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function writeDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = { ...readDraft(), ...patch };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearDraft(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(KEY);
  }
}
