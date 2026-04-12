import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError } from '@/lib/api-utils';

const translateSchema = z.object({
  text: z.string().trim().min(1, 'Text is required').max(500, 'Text is too long'),
  appName: z.string().trim().min(1, 'App name is required').max(100, 'App name is too long'),
  nativeLanguage: z.string().trim().min(1, 'Native language is required').max(50, 'Native language is too long'),
});

type LlmChoice = {
  message?: {
    content?: string | null;
  };
};

type LlmResponse = {
  choices?: LlmChoice[];
};

function buildTranslationMessages(appName: string, nativeLanguage: string, text: string) {
  return [
    {
      role: 'system' as const,
      content: [
        'You are a professional translator for language learners.',
        `Translate from English into ${nativeLanguage}.`,
        'Your job is to choose the translation a normal native speaker would use most often today.',
        'Prefer the most common, neutral, modern, everyday translation.',
        'Avoid rare, archaic, literary, overly formal, regional, or overly technical translations unless the source text clearly requires them.',
        'If the input is a single word with no context, choose the most common default meaning, not an obscure dictionary sense.',
        'For a single bare word, do not translate it as a verb unless the English input explicitly marks a verb form.',
        'Treat it as an explicit verb only when the input includes "to " before the verb or when the word itself is clearly an inflected verb form such as "hunted", "hunting", or "hunts".',
        'If the input is a bare base-form word like "hunt", prefer the most common non-verb translation unless verb marking is explicitly present.',
        'If the input is a short phrase or sentence, produce a natural translation that preserves the intended meaning.',
        'Return only the translation text.',
        'Do not explain your choice.',
        'Do not add alternatives, notes, parentheses, transliteration, or examples.',
      ].join(' '),
    },
    {
      role: 'user' as const,
      content: [
        `App: ${appName}`,
        `Target language: ${nativeLanguage}`,
        'Task: Translate the English input into the most common natural translation for a learner.',
        'Important: prefer the default everyday translation that people actually use most often.',
        'Part of speech rule: translate as a verb only if the English input explicitly shows a verb form, such as "to hunt" or "hunted".',
        `English input: ${text}`,
      ].join('\n'),
    },
  ];
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = translateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  }

  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    return jsonError(500, 'LLM_API_KEY is not configured');
  }

  const { text, appName, nativeLanguage } = parsed.data;

  const response = await fetch('https://api.llmapi.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.0-flash-lite',
      temperature: 0,
      messages: buildTranslationMessages(appName, nativeLanguage, text),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    return jsonError(502, errorText || 'Translation provider request failed');
  }

  const data = (await response.json().catch(() => null)) as LlmResponse | null;
  const translation = data?.choices?.[0]?.message?.content?.trim();

  if (!translation) {
    return jsonError(502, 'Translation provider returned an empty response');
  }

  return NextResponse.json({
    translation,
    nativeLanguage,
    appName,
  });
}
