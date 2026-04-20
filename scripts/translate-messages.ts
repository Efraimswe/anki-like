/**
 * Offline one-shot translation script.
 * Usage: pnpm tsx scripts/translate-messages.ts
 * Reads messages/en.json, translates to all 29 target locales, writes messages/{code}.json.
 * Requires ANTHROPIC_API_KEY in environment.
 */
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const LOCALES: Record<string, string> = {
  ru: 'Russian', fr: 'French', es: 'Spanish', de: 'German',
  zh: 'Simplified Chinese', pt: 'Portuguese (Brazilian)', ar: 'Arabic',
  ja: 'Japanese', ko: 'Korean', it: 'Italian', nl: 'Dutch',
  pl: 'Polish', tr: 'Turkish', vi: 'Vietnamese', th: 'Thai',
  id: 'Indonesian', uk: 'Ukrainian', cs: 'Czech', el: 'Greek',
  he: 'Hebrew', hi: 'Hindi', sv: 'Swedish', ro: 'Romanian',
  hu: 'Hungarian', da: 'Danish', fi: 'Finnish', no: 'Norwegian',
  sk: 'Slovak', bg: 'Bulgarian', hr: 'Croatian',
};

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'messages');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'en.json'), 'utf8'));

const client = new Anthropic();

async function translate(locale: string, langName: string): Promise<void> {
  const outPath = path.join(ROOT, `${locale}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  skip ${locale} (already exists)`);
    return;
  }

  console.log(`  translating → ${locale} (${langName})…`);
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Translate all JSON string values to ${langName}. Rules:
- Keep all JSON keys exactly as-is.
- Preserve ICU placeholders like {count}, {name}, {plural, ...} exactly.
- Keep emoji characters as-is.
- Keep "→" arrows as-is.
- For English level names (A1, B2, etc.) keep the letter+number code in the "title" but translate the description words.
- Output ONLY the translated JSON, no markdown fences, no commentary.

JSON to translate:
${JSON.stringify(EN, null, 2)}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleaned);
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n');
  console.log(`  ✓ ${locale}`);
}

(async () => {
  console.log(`Translating en.json → ${Object.keys(LOCALES).length} locales\n`);
  for (const [code, name] of Object.entries(LOCALES)) {
    try {
      await translate(code, name);
    } catch (e) {
      console.error(`  ✗ ${code}:`, (e as Error).message);
    }
  }
  console.log('\nDone.');
})();
