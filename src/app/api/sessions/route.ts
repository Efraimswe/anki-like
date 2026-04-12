import { NextResponse } from 'next/server';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { getSessionsByUser } from '@/lib/session';
import type { TokenPayload } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const sessions = await getSessionsByUser(user.sub);
  const withCurrent = sessions.map((s) => ({
    ...s,
    isCurrent: s.id === user.sid,
  }));

  return NextResponse.json({ sessions: withCurrent });
}
