import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createCardSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const { deckId, front, back, type, tags } = parsed.data;

  // Verify deck ownership
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId: user.sub, deletedAt: null } });
  if (!deck) return jsonError(404, 'Deck not found');

  // Validate cloze
  if (type === 'cloze' && !front.includes('{{')) {
    return jsonError(400, 'Cloze cards must contain {{...}} deletions');
  }

  if (type === 'reverse') {
    const cards = await prisma.$transaction(async (tx) => {
      const forward = await tx.card.create({
        data: { deckId, front, back, type: 'reverse', tags },
        select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
      });
      await tx.cardState.create({ data: { cardId: forward.id } });

      const reverse = await tx.card.create({
        data: { deckId, front: back, back: front, type: 'reverse', tags, sourceCardId: forward.id },
        select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
      });
      await tx.cardState.create({ data: { cardId: reverse.id } });

      return [forward, reverse];
    });
    return NextResponse.json(cards, { status: 201 });
  }

  const card = await prisma.$transaction(async (tx) => {
    const c = await tx.card.create({
      data: { deckId, front, back, type, tags },
      select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
    });
    await tx.cardState.create({ data: { cardId: c.id } });
    return c;
  });

  return NextResponse.json(card, { status: 201 });
}
