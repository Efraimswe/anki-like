import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { getLimitsWithCounters, updateLimits } from '@/lib/daily-limits';
import { updateDailyLimitsSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const data = await getLimitsWithCounters(user.sub);
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = updateDailyLimitsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  await updateLimits(user.sub, parsed.data.maxNewCards, parsed.data.maxReviews);
  const data = await getLimitsWithCounters(user.sub);
  return NextResponse.json(data);
}
