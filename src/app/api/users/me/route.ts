import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { updateProfileSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      onboardingCompleted: true,
      nativeLanguage: true,
      interfaceLanguage: true,
      skillLevels: true,
      goals: true,
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

  const data: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) data.displayName = parsed.data.displayName;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  if (parsed.data.interfaceLanguage !== undefined) data.interfaceLanguage = parsed.data.interfaceLanguage;
  if (parsed.data.skillLevels !== undefined) data.skillLevels = parsed.data.skillLevels;

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data,
    select: { id: true, email: true, displayName: true, createdAt: true },
  });

  return NextResponse.json(updated);
}
