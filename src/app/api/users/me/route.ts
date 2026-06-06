import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { ensureUserRecord } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  await ensureUserRecord(user.sub);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      targetLanguage: true,
      createdAt: true,
    },
  });

  if (!dbUser) return jsonError(404, 'User not found');
  return NextResponse.json(dbUser);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  }

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: parsed.data,
    select: { id: true, email: true, displayName: true, targetLanguage: true, createdAt: true },
  });

  return NextResponse.json(updated);
}
