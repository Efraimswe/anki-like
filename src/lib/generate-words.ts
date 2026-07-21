const MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

export type GeneratedWord = { word: string; translate: string };

const norm = (s: string) => s.toLowerCase().trim();

type GenerateWordsOptions = {
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  theme?: string;
  exclude?: string[];
};

const DIFFICULTY_LEVEL: Record<GenerateWordsOptions['difficulty'], string> = {
  easy: 'beginner (CEFR A1–A2)',
  medium: 'intermediate (CEFR B1–B2)',
  hard: 'advanced (CEFR C1–C2)',
};

// Over-ask so that after removing already-seen words we still have enough.
const OVERASK = 8;

const PROMPT = ({ difficulty, count, theme, exclude }: GenerateWordsOptions) =>
  `Give me exactly ${count + OVERASK} distinct random English words appropriate for a ${DIFFICULTY_LEVEL[difficulty]} learner.${
    theme && theme.trim() ? ` All words must relate to the theme "${theme.trim()}".` : ' Pick random, unrelated words.'
  }${
    exclude && exclude.length > 0 ? ` Do NOT use or repeat ANY of these already-seen words — return completely different ones: ${exclude.slice(-150).join(', ')}.` : ''
  } For each word give ONE concise Russian translation. Return ONLY a JSON array like [{"word":"...","translate":"..."}] — no markdown, no prose.`;

type OpenRouterResponse = { choices?: { message?: { content?: string } }[]; error?: unknown };

async function tryModel(apiKey: string, model: string, opts: GenerateWordsOptions, signal: AbortSignal): Promise<GeneratedWord[]> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: PROMPT(opts) }],
      temperature: 0.7,
    }),
    cache: 'no-store',
    signal,
  });

  if (!res.ok) throw new Error('non-ok');

  const data = await res.json() as OpenRouterResponse;
  if (data.error) throw new Error('provider error');

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) throw new Error('no array in response');

  const parsed = JSON.parse(match[0]) as unknown[];

  // Deterministically drop already-seen words (case/space-insensitive) and
  // in-batch duplicates — free models often ignore the "don't repeat" line.
  const excludeSet = new Set((opts.exclude ?? []).map(norm));
  const seen = new Set<string>();
  const results = parsed
    .filter((v): v is GeneratedWord =>
      typeof v === 'object' && v !== null &&
      typeof (v as GeneratedWord).word === 'string' &&
      typeof (v as GeneratedWord).translate === 'string',
    )
    .filter((w) => {
      const key = norm(w.word);
      if (!key || excludeSet.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, opts.count);
  if (results.length === 0) throw new Error('empty results');

  return results;
}

/**
 * Generate a list of random English words (with Russian translations) via OpenRouter.
 * All models are tried in parallel — first success wins. 8s global timeout.
 */
export async function generateWords(opts: GenerateWordsOptions): Promise<GeneratedWord[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const result = await Promise.any(
      MODELS.map(model => tryModel(apiKey, model, opts, controller.signal)),
    );
    return result;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    controller.abort(); // cancel any still-running requests
  }
}
