import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { translateQuerySchema } from '@/lib/validations';
import { fetchTranslations } from '@/lib/translate';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = translateQuerySchema.safeParse({
    word: request.nextUrl.searchParams.get('word'),
  });
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const options = await fetchTranslations(parsed.data.word);
  return NextResponse.json({ options });
}
