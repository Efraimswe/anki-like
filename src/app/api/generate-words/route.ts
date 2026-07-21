import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { generateWordsSchema } from '@/lib/validations';
import { generateWords } from '@/lib/generate-words';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = generateWordsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const words = await generateWords(parsed.data);
  return NextResponse.json({ words });
}
