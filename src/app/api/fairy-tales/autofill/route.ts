import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';

const COMPLETIONS_URL = process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.LLM_API_KEY || '';
const MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

async function llmJson(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(COMPLETIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const content = await llmJson([
    {
      role: 'system',
      content:
        'You are a creative fairy tale writer. Return ONLY valid JSON with no markdown, no code fences, no explanation.',
    },
    {
      role: 'user',
      content: `Generate a random fairy tale brief. Return exactly this JSON shape:
{
  "characters": [
    { "name": "string", "description": "string" },
    { "name": "string", "description": "string" },
    { "name": "string", "description": "string" }
  ],
  "brief": {
    "setting": "string",
    "premise": "string",
    "conflict": "string",
    "tone": "string"
  }
}
Make it imaginative and varied. Characters should be 2–4. All fields non-empty.`,
    },
  ]);

  let parsed: unknown;
  try {
    const cleaned = content.replace(/^```[a-z]*\n?/i, '').replace(/```$/,'').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 });
  }

  return NextResponse.json(parsed);
}
