import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { ensureDeckFsrsConfig } from '@/lib/fsrs-config';
import { optimizeDeckFsrs } from '@/lib/fsrs-optimize';
import type { TokenPayload } from '@/lib/auth';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const deck = await prisma.deck.findFirst({
    where: { id, userId: user.sub, deletedAt: null },
    select: { id: true },
  });
  if (!deck) return jsonError(404, 'Deck not found');

  await ensureDeckFsrsConfig(id);
  const reviews = await prisma.reviewLog.findMany({
    where: { card: { deckId: id, deck: { userId: user.sub } } },
    orderBy: { reviewedAt: 'asc' },
    select: {
      cardId: true,
      rating: true,
      reviewedAt: true,
    },
  });

  const result = await optimizeDeckFsrs(reviews);
  if (!result.ok) {
    return jsonError(409, result.reason || 'Not enough review history to optimize this deck.');
  }

  const config = await prisma.deckFsrsConfig.update({
    where: { deckId: id },
    data: {
      weights: result.weights!,
      isOptimized: true,
      lastOptimizedAt: new Date(),
    },
  });

  return NextResponse.json({
    ...result,
    config,
  });
}
