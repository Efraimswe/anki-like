export type ChipColor = 'rose' | 'blue' | 'purple' | 'amber' | 'green';

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
  chip: ChipColor;
}

export const LANGUAGES: Language[] = [
  { code: 'ru', name: 'Russian',    flag: '🇷🇺', nativeName: 'Русский',           chip: 'rose' },
  { code: 'fr', name: 'French',     flag: '🇫🇷', nativeName: 'Français',          chip: 'blue' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸', nativeName: 'Español',           chip: 'amber' },
  { code: 'de', name: 'German',     flag: '🇩🇪', nativeName: 'Deutsch',           chip: 'blue' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳', nativeName: '中文',              chip: 'rose' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português',         chip: 'green' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦', nativeName: 'العربية',           chip: 'green' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵', nativeName: '日本語',            chip: 'purple' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷', nativeName: '한국어',            chip: 'purple' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹', nativeName: 'Italiano',          chip: 'amber' },
  { code: 'nl', name: 'Dutch',      flag: '🇳🇱', nativeName: 'Nederlands',        chip: 'blue' },
  { code: 'pl', name: 'Polish',     flag: '🇵🇱', nativeName: 'Polski',            chip: 'rose' },
  { code: 'tr', name: 'Turkish',    flag: '🇹🇷', nativeName: 'Türkçe',           chip: 'rose' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt',       chip: 'amber' },
  { code: 'th', name: 'Thai',       flag: '🇹🇭', nativeName: 'ไทย',              chip: 'amber' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia',  chip: 'green' },
  { code: 'uk', name: 'Ukrainian',  flag: '🇺🇦', nativeName: 'Українська',        chip: 'blue' },
  { code: 'cs', name: 'Czech',      flag: '🇨🇿', nativeName: 'Čeština',          chip: 'blue' },
  { code: 'el', name: 'Greek',      flag: '🇬🇷', nativeName: 'Ελληνικά',         chip: 'blue' },
  { code: 'he', name: 'Hebrew',     flag: '🇮🇱', nativeName: 'עברית',            chip: 'purple' },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳', nativeName: 'हिन्दी',           chip: 'amber' },
  { code: 'sv', name: 'Swedish',    flag: '🇸🇪', nativeName: 'Svenska',           chip: 'blue' },
  { code: 'ro', name: 'Romanian',   flag: '🇷🇴', nativeName: 'Română',           chip: 'amber' },
  { code: 'hu', name: 'Hungarian',  flag: '🇭🇺', nativeName: 'Magyar',            chip: 'green' },
  { code: 'da', name: 'Danish',     flag: '🇩🇰', nativeName: 'Dansk',             chip: 'blue' },
  { code: 'fi', name: 'Finnish',    flag: '🇫🇮', nativeName: 'Suomi',             chip: 'green' },
  { code: 'no', name: 'Norwegian',  flag: '🇳🇴', nativeName: 'Norsk',             chip: 'blue' },
  { code: 'sk', name: 'Slovak',     flag: '🇸🇰', nativeName: 'Slovenčina',       chip: 'purple' },
  { code: 'bg', name: 'Bulgarian',  flag: '🇧🇬', nativeName: 'Български',         chip: 'purple' },
  { code: 'hr', name: 'Croatian',   flag: '🇭🇷', nativeName: 'Hrvatski',          chip: 'amber' },
];

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function isValidLanguageCode(code: string): boolean {
  return LANGUAGES.some((l) => l.code === code);
}
