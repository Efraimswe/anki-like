import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { ensureDeckFsrsConfig } from '@/lib/fsrs-config';
import { updateDeckFsrsSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

async function findOwnedDeck(deckId: string, userId: string) {
  return prisma.deck.findFirst({
    where: { id: deckId, userId, deletedAt: null },
    select: { id: true },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const deck = await findOwnedDeck(id, user.sub);
  if (!deck) return jsonError(404, 'Deck not found');

  const config = await ensureDeckFsrsConfig(id);
  return NextResponse.json(config);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const deck = await findOwnedDeck(id, user.sub);
  if (!deck) return jsonError(404, 'Deck not found');

  const body = await request.json().catch(() => null);
  const parsed = updateDeckFsrsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  await ensureDeckFsrsConfig(id);
  const config = await prisma.deckFsrsConfig.update({
    where: { deckId: id },
    data: {
      desiredRetention: parsed.data.desiredRetention,
      maximumInterval: parsed.data.maximumInterval,
    },
  });

  return NextResponse.json(config);
}
