interface MyMemoryMatch {
  translation?: string;
  quality?: string | number;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  matches?: MyMemoryMatch[];
}

/**
 * Fetch up to 5 distinct translation options for an English word into Russian
 * using the free MyMemory API. Returns [] on any failure.
 */
export async function fetchTranslations(word: string): Promise<string[]> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    word,
  )}&langpair=en|ru`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];

    const data: MyMemoryResponse = await res.json();

    const seen = new Set<string>();
    const options: string[] = [];

    const push = (raw?: string) => {
      const value = raw?.trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push(value);
    };

    for (const match of data.matches ?? []) {
      push(match.translation);
      if (options.length >= 5) break;
    }

    if (options.length === 0) push(data.responseData?.translatedText);

    return options.slice(0, 5);
  } catch {
    return [];
  }
}
