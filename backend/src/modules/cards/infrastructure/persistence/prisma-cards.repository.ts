import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { CardsRepository } from '../../domain/ports/cards.repository';

@Injectable()
export class PrismaCardsRepository implements CardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBasicCardWithState(data: {
    deckId: string;
    front: string;
    back: string;
    type: string;
    tags: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data,
        select: {
          id: true,
          deckId: true,
          front: true,
          back: true,
          type: true,
          tags: true,
          createdAt: true,
        },
      });

      await tx.cardState.create({ data: { cardId: card.id } });

      return card;
    });
  }

  async createReverseCardsWithState(data: {
    deckId: string;
    front: string;
    back: string;
    tags: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const forwardCard = await tx.card.create({
        data: { deckId: data.deckId, front: data.front, back: data.back, type: 'reverse', tags: data.tags },
        select: {
          id: true,
          deckId: true,
          front: true,
          back: true,
          type: true,
          tags: true,
          createdAt: true,
        },
      });
      await tx.cardState.create({ data: { cardId: forwardCard.id } });

      const reverseCard = await tx.card.create({
        data: {
          deckId: data.deckId,
          front: data.back,
          back: data.front,
          type: 'reverse',
          tags: data.tags,
          sourceCardId: forwardCard.id,
        },
        select: {
          id: true,
          deckId: true,
          front: true,
          back: true,
          type: true,
          tags: true,
          createdAt: true,
        },
      });
      await tx.cardState.create({ data: { cardId: reverseCard.id } });

      return [forwardCard, reverseCard];
    });
  }

  async findByDeck(
    userId: string,
    deckId: string,
    options: { tag?: string; page: number; limit: number },
  ) {
    const skip = (options.page - 1) * options.limit;
    const where: {
      deckId: string;
      deletedAt: null;
      deck: { userId: string };
      tags?: { has: string };
    } = {
      deckId,
      deletedAt: null,
      deck: { userId },
    };

    if (options.tag) {
      where.tags = { has: options.tag };
    }

    const [data, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: options.limit,
        select: {
          id: true,
          deckId: true,
          front: true,
          back: true,
          type: true,
          tags: true,
          createdAt: true,
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    return { data, total };
  }

  async findAllForUser(userId: string) {
    return this.prisma.card.findMany({
      where: { deletedAt: null, deck: { userId, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deckId: true,
        front: true,
        back: true,
        type: true,
        tags: true,
        createdAt: true,
        deck: { select: { id: true, name: true } },
      },
    });
  }

  async findByTag(userId: string, tag: string) {
    return this.prisma.card.findMany({
      where: { tags: { has: tag }, deletedAt: null, deck: { userId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deckId: true,
        front: true,
        back: true,
        type: true,
        tags: true,
        createdAt: true,
      },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.card.findFirst({
      where: { id, deletedAt: null, deck: { userId } },
      include: { cardState: true },
    });
  }

  async existsForUser(userId: string, id: string) {
    const card = await this.prisma.card.findFirst({
      where: { id, deletedAt: null, deck: { userId } },
      select: { id: true },
    });

    return Boolean(card);
  }

  async update(id: string, data: {
    front?: string;
    back?: string;
    tags?: string[];
    updatedAt: Date;
  }) {
    return this.prisma.card.update({
      where: { id },
      data: {
        front: data.front ?? undefined,
        back: data.back ?? undefined,
        tags: data.tags ?? undefined,
        updatedAt: data.updatedAt,
      },
      select: {
        id: true,
        deckId: true,
        front: true,
        back: true,
        type: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async softDelete(id: string, deletedAt: Date) {
    await this.prisma.card.update({
      where: { id },
      data: { deletedAt },
    });
  }
}
