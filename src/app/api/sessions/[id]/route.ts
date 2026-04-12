import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { deleteSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { TokenPayload } from '@/lib/auth';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  if (id === user.sid) {
    return jsonError(400, 'Cannot revoke current session');
  }

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.userId !== user.sub) {
    return jsonError(404, 'Session not found');
  }

  await deleteSession(id);
  return new NextResponse(null, { status: 204 });
}
