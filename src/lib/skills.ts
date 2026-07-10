export const SKILL_CODES = [
  'speaking', 'reading', 'listening', 'writing', 'vocabulary', 'grammar',
] as const;
export type SkillCode = (typeof SKILL_CODES)[number];

export const MAX_LEVEL = 10;

export interface SkillDef {
  code: SkillCode;
  name: string;       // отображаемое имя (English)
  levels: string[];   // ровно 10 строк; индекс 0 = уровень 1
}

export const SKILLS: Record<SkillCode, SkillDef> = {
  speaking: {
    code: 'speaking',
    name: 'Speaking',
    levels: [
      "A few sentences about myself (name, where I'm from, what I do)",
      'Greetings, goodbyes, thanks, simple questions',
      'Handle everyday situations: order food, buy things, ask for directions',
      'Talk about my day/plans in 5–10 sentences',
      'Hold small talk for 2–3 minutes',
      'Explain a problem and ask for help (hotel, doctor, service)',
      'Tell a real-life story that people understand',
      'Argue and explain my opinion, even with mistakes',
      "Talk 15+ minutes without switching to my native language",
      "Freedom: talk to anyone about anything — with plenty of mistakes, but I talk and I'm not afraid",
    ],
  },
  reading: {
    code: 'reading',
    name: 'Reading',
    levels: [
      'Read single words, signs, names',
      'Understand short messages, menus, captions',
      'Read graded texts for beginners',
      'Read comics/manga and get the point',
      'Catch the main idea of an article on a familiar topic',
      'Read posts and forums, rarely need a dictionary',
      'Finished my first simple book',
      'Read articles in my field with ease',
      "Read a regular book — don't know every word, but never lose the plot",
      'Freedom: read books for pleasure — no translating in my head, just reading and enjoying',
    ],
  },
  listening: {
    code: 'listening',
    name: 'Listening',
    levels: [
      'Catch familiar words in slow speech',
      'Understand simple phrases spoken clearly',
      'Understand podcasts/videos for beginners',
      'Watch familiar anime/shows with English subs',
      'Understand YouTube on familiar topics with subs',
      'Understand learner podcasts without subs',
      'Shows with English subs, almost no pausing',
      'Regular YouTube without subs: main idea + details',
      'Fast natural speech, accents, movies without subs',
      'Freedom: listen to anything and just understand, no effort',
    ],
  },
  writing: {
    code: 'writing',
    name: 'Writing',
    levels: [
      '2–3 sentences about myself',
      'A short chat message',
      'Simple back-and-forth messaging',
      'A social media post or comment',
      'A template-based email (request, complaint)',
      'Describe an event/story in a paragraph or two',
      'Work correspondence with clients',
      'Long structured text (review, guide, article)',
      "Write fast and naturally, mistakes don't block understanding",
      'Freedom: write anything to anyone without fear or a translator',
    ],
  },
  vocabulary: {
    code: 'vocabulary',
    name: 'Vocabulary',
    levels: [
      '~100 survival words',
      '~300: daily life, food, family, work',
      '~600: describe any everyday thing in simple words',
      '~1,000: understand most everyday speech',
      '~2,000: stop translating every word in my head',
      'Phrasal verbs and basic idioms',
      '~3,000+: shows and posts without a dictionary',
      'Vocabulary of my field — talk about my work freely',
      '~5,000+: say the same thing in different ways, feel the nuances',
      "Freedom: don't know a word → explain it with other words, and it's no problem at all",
    ],
  },
  grammar: {
    code: 'grammar',
    name: 'Grammar',
    levels: [
      'Build a simple sentence: I am / I have / I like',
      'Present Simple: routines, questions, negatives',
      'Past: tell what happened',
      'Future: plans and promises (will / going to)',
      'Continuous and how it differs from Simple',
      'Present Perfect vs Past Simple (the big wall — cleared)',
      'Modal verbs, conditionals 0–2',
      'Passive voice, reported speech, conditional 3',
      'Feel the right tense without recalling the rule',
      "Freedom: grammar on autopilot — rare mistakes don't get in the way",
    ],
  },
};

export function isSkillCode(v: string): v is SkillCode {
  return (SKILL_CODES as readonly string[]).includes(v);
}

// уровень 1..10 → текст условия
export function skillLevelText(code: SkillCode, level: number): string {
  return SKILLS[code].levels[level - 1] ?? '';
}

// Чистая доменная функция последовательности — тестируется в C1.
// Возвращает новое значение completedLevel или null, если действие недопустимо.
export function nextCompletedLevel(
  current: number,
  level: number,
  action: 'complete' | 'uncomplete',
): number | null {
  if (level < 1 || level > MAX_LEVEL) return null;
  if (action === 'complete')   return level === current + 1 ? level : null;
  if (action === 'uncomplete') return level === current ? level - 1 : null;
  return null;
}
