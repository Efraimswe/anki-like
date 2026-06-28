const MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

const PROMPT = (word: string) =>
  `Give me exactly 5 different Russian translations for the English word "${word}". Return ONLY a JSON array of 5 strings, no explanation, no markdown. Example: ["слово1","слово2","слово3","слово4","слово5"]`;

type OpenRouterResponse = { choices?: { message?: { content?: string } }[]; error?: unknown };

async function tryModel(apiKey: string, model: string, word: string, signal: AbortSignal): Promise<string[]> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: PROMPT(word) }],
      temperature: 0.3,
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
  const results = parsed.filter((v): v is string => typeof v === 'string').slice(0, 5);
  if (results.length === 0) throw new Error('empty results');

  return results;
}

/**
 * Fetch up to 5 distinct Russian translations for an English word via OpenRouter.
 * All models are tried in parallel — first success wins. 8s global timeout.
 */
export async function fetchTranslations(word: string): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const result = await Promise.any(
      MODELS.map(model => tryModel(apiKey, model, word, controller.signal)),
    );
    return result;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    controller.abort(); // cancel any still-running requests
  }
}
