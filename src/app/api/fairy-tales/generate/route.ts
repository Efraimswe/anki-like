import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-utils';
import { streamLLMCompletion } from '@/lib/llmStream';

const bodySchema = z.object({
  characters: z
    .array(z.object({ name: z.string().min(1), description: z.string() }))
    .min(1)
    .max(15),
  brief: z.object({
    setting: z.string().optional().default(''),
    premise: z.string().min(1),
    conflict: z.string().optional().default(''),
    tone: z.string().optional().default('whimsical'),
  }),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rawBody = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response('Invalid request body', { status: 400 });
  }

  const { characters, brief } = parsed.data;

  const characterList = characters
    .map((c) => `- ${c.name}: ${c.description || 'no description'}`)
    .join('\n');

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a creative storyteller. Write a complete fairy tale based on the user\'s brief. Use the provided characters as the main cast. Match the requested tone. Keep paragraphs short and readable. End with a clear resolution.',
    },
    {
      role: 'user' as const,
      content: `Setting: ${brief.setting || '(unspecified)'}
Premise: ${brief.premise}
Main conflict: ${brief.conflict || '(unspecified)'}
Tone: ${brief.tone || 'whimsical'}

Characters:
${characterList}

Write the story now.`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLLMCompletion(messages, request.signal)) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
