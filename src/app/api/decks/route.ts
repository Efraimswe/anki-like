import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createDeckSchema } from '@/lib/validations';
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

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = createDeckSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const deck = await prisma.deck.create({
    data: {
      name: parsed.data.name,
      userId: user.sub,
      ...(parsed.data.dailyReviewLimit ? { dailyReviewLimit: parsed.data.dailyReviewLimit } : {}),
      ...(parsed.data.dailyAddLimit ? { dailyAddLimit: parsed.data.dailyAddLimit } : {}),
    },
    select: { id: true, name: true, dailyReviewLimit: true, dailyAddLimit: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ...deck, cardCount: 0, dueCount: 0 }, { status: 201 });
}
