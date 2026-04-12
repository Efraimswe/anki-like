import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, clearAuthCookies } from '@/lib/auth';
import { deleteSession } from '@/lib/session';

export async function POST() {
  const user = await getAuthUser();
  if (user) {
    await deleteSession(user.sid);
  }
  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
