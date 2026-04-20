export const LEVELS = [
  'A1', 'A1 solid',
  'A2', 'A2 solid',
  'B1', 'B1 solid',
  'B2', 'B2 solid',
  'C1', 'C1 solid',
  'C2', 'C2 solid',
  'Fluent',
] as const;

export type Level = (typeof LEVELS)[number];

export type LevelGroup = 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent';

export interface LevelData {
  code: Level;
  title: string;
  sub: string;
  desc: string;
  group: LevelGroup;
}

export const LEVEL_DATA: LevelData[] = [
  { code: 'A1',       title: 'Beginner',                sub: 'Just starting out',          desc: 'Basic words, simple phrases',          group: 'Beginner' },
  { code: 'A1 solid', title: 'Strong beginner',         sub: 'Getting the basics down',    desc: 'Simple sentences, familiar topics',    group: 'Beginner' },
  { code: 'A2',       title: 'Elementary',              sub: 'Can handle everyday topics',  desc: 'Short exchanges, routine tasks',       group: 'Beginner' },
  { code: 'A2 solid', title: 'Strong elementary',       sub: 'Almost pre-intermediate',    desc: 'Familiar situations, direct info',      group: 'Beginner' },
  { code: 'B1',       title: 'Intermediate',            sub: 'Can navigate most situations', desc: 'Main points clear, common topics',   group: 'Intermediate' },
  { code: 'B1 solid', title: 'Strong intermediate',     sub: 'Comfortable in conversation', desc: 'Fairly fluent, some gaps remain',     group: 'Intermediate' },
  { code: 'B2',       title: 'Upper-intermediate',      sub: 'Handles complex language',   desc: 'Fluent with native speakers',           group: 'Intermediate' },
  { code: 'B2 solid', title: 'Strong upper-intermediate', sub: 'Near advanced',            desc: 'Spontaneous, nuanced communication',   group: 'Intermediate' },
  { code: 'C1',       title: 'Advanced',                sub: 'Expressive and precise',     desc: 'Flexible, effective use of language',  group: 'Advanced' },
  { code: 'C1 solid', title: 'Strong advanced',         sub: 'Almost mastery',             desc: 'Clear, well-structured, nuanced',       group: 'Advanced' },
  { code: 'C2',       title: 'Mastery',                 sub: 'Near native precision',      desc: 'Effortless, all contexts',              group: 'Advanced' },
  { code: 'C2 solid', title: 'Strong mastery',          sub: 'Indistinguishable from native', desc: 'Perfect command of language',        group: 'Advanced' },
  { code: 'Fluent',   title: 'Native-like',             sub: 'Fully fluent',               desc: 'Native or near-native proficiency',     group: 'Fluent' },
];

export const LEVEL_GROUPS: LevelGroup[] = ['Beginner', 'Intermediate', 'Advanced', 'Fluent'];

export function isLevel(value: unknown): value is Level {
  return LEVELS.includes(value as Level);
}

export function getLevelData(code: Level): LevelData | undefined {
  return LEVEL_DATA.find((l) => l.code === code);
}
