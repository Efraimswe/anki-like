const MODEL = 'google/gemma-4-31b-it:free';

/**
 * Fetch up to 5 distinct Russian translations for an English word
 * using OpenRouter (Gemini Flash free tier). Returns [] on any failure.
 */
export async function fetchTranslations(word: string): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: `Give me exactly 5 different Russian translations for the English word "${word}". Return ONLY a JSON array of 5 strings, no explanation, no markdown. Example: ["слово1","слово2","слово3","слово4","слово5"]`,
          },
        ],
        temperature: 0.3,
      }),
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as unknown[];
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, 5);
  } catch {
    return [];
  }
}
