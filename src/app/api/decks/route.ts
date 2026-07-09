import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { getNow } from '@/lib/clock';
import { countDueForReview } from '@/lib/due';
import type { TokenPayload } from '@/lib/auth';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const cursor = request.nextUrl.searchParams.get('cursor') || undefined;

  const decks = await prisma.deck.findMany({
    where: { userId: user.sub, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      cards: {
        where: { deletedAt: null },
        select: { id: true, cardState: { select: { phase: true, dueDate: true } } },
      },
    },
  });

  const hasMore = decks.length > PAGE_SIZE;
  const page = hasMore ? decks.slice(0, PAGE_SIZE) : decks;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const now = getNow();
  const items = page.map((d) => ({
    id: d.id,
    name: d.name,
    dailyReviewLimit: d.dailyReviewLimit,
    dailyAddLimit: d.dailyAddLimit,
    cardCount: d.cards.length,
    dueCount: countDueForReview(d.cards.map((c) => c.cardState), now),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return NextResponse.json({ items, nextCursor });
}
