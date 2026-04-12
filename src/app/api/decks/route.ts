import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createDeckSchema } from '@/lib/validations';
import { buildDefaultDeckFsrsConfig } from '@/lib/fsrs-defaults';
import type { TokenPayload } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const decks = await prisma.deck.findMany({
    where: { userId: user.sub, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      cards: {
        where: { deletedAt: null },
        select: { id: true, cardState: { select: { dueDate: true, phase: true } } },
      },
    },
  });

  const now = new Date();
  const result = decks.map((d) => {
    const dueCount = d.cards.filter((c) => c.cardState && new Date(c.cardState.dueDate) <= now).length;
    const newCount = d.cards.filter((c) => c.cardState?.phase === 'new').length;
    return {
      id: d.id,
      name: d.name,
      cardCount: d.cards.length,
      dueCount,
      newCount,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  });

  return NextResponse.json(result);
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
      fsrs: {
        create: buildDefaultDeckFsrsConfig(),
      },
    },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ...deck, cardCount: 0, dueCount: 0, newCount: 0 }, { status: 201 });
}
