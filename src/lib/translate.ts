const MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

const PROMPT = (word: string) =>
  `Give me exactly 5 different Russian translations for the English word "${word}". Return ONLY a JSON array of 5 strings, no explanation, no markdown. Example: ["слово1","слово2","слово3","слово4","слово5"]`;

type OpenRouterResponse = { choices?: { message?: { content?: string } }[]; error?: { code?: number } };

async function tryModel(apiKey: string, model: string, word: string): Promise<string[] | null> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: PROMPT(word) }],
      temperature: 0.3,
    }),
    cache: 'no-store',
  });

  const data = await res.json() as OpenRouterResponse;

  // Rate limit or provider error — signal caller to try next model
  if (!res.ok || data.error) return null;

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as unknown[];
  const results = parsed.filter((v): v is string => typeof v === 'string').slice(0, 5);
  return results.length > 0 ? results : null;
}

/**
 * Fetch up to 5 distinct Russian translations for an English word via OpenRouter.
 * Tries multiple free models in order to handle rate limits. Returns [] on total failure.
 */
export async function fetchTranslations(word: string): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  for (const model of MODELS) {
    try {
      const result = await tryModel(apiKey, model, word);
      if (result) return result;
    } catch {
      // network error, try next
    }
  }

  return [];
}
