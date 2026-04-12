import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { DecksRepository } from '../../domain/ports/decks.repository';

@Injectable()
export class PrismaDecksRepository implements DecksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.deck.create({
      data: { name, userId },
      select: { id: true, name: true, createdAt: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.deck.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        cards: {
          where: { deletedAt: null },
          select: {
            id: true,
            cardState: { select: { dueDate: true } },
          },
        },
      },
    });
  }

  async findOneByUser(userId: string, id: string) {
    return this.prisma.deck.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        cards: {
          where: { deletedAt: null },
          select: {
            id: true,
            cardState: { select: { dueDate: true, phase: true } },
          },
        },
      },
    });
  }

  async existsForUser(userId: string, id: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    return Boolean(deck);
  }

  async update(id: string, data: { name?: string; updatedAt: Date }) {
    return this.prisma.deck.update({
      where: { id },
      data: { name: data.name ?? undefined, updatedAt: data.updatedAt },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async softDeleteWithCards(userId: string, id: string, now: Date) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.card.updateMany({
        where: { deckId: id, deck: { userId }, deletedAt: null },
        data: { deletedAt: now },
      });
      const deck = await tx.deck.updateMany({
        where: { id, userId, deletedAt: null },
        data: { deletedAt: now },
      });
      return deck.count;
    });

    return result;
  }
}
