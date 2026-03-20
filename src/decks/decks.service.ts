import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeckDto) {
    const deck = await this.prisma.deck.create({
      data: { name: dto.name },
      select: { id: true, name: true, createdAt: true },
    });
    return deck;
  }

  async findAll() {
    const decks = await this.prisma.deck.findMany({
      where: { deletedAt: null },
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

    return decks.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt,
      cardCount: d.cards.length,
      dueCount: d.cards.filter((c) => c.cardState && c.cardState.dueDate <= new Date()).length,
    }));
  }

  async findOne(id: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id, deletedAt: null },
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

    if (!deck) throw new NotFoundException('Deck not found');

    return {
      id: deck.id,
      name: deck.name,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      cardCount: deck.cards.length,
      dueCount: deck.cards.filter((c) => c.cardState && c.cardState.dueDate <= new Date()).length,
      newCount: deck.cards.filter((c) => c.cardState && c.cardState.phase === 'new').length,
    };
  }

  async update(id: string, dto: UpdateDeckDto) {
    const existing = await this.prisma.deck.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Deck not found');

    const deck = await this.prisma.deck.update({
      where: { id },
      data: { name: dto.name ?? undefined, updatedAt: new Date() },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return deck;
  }

  async remove(id: string) {
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      // Soft-delete cards in the deck
      await tx.card.updateMany({
        where: { deckId: id, deletedAt: null },
        data: { deletedAt: now },
      });
      // Soft-delete the deck
      const deck = await tx.deck.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: now },
      });
      return deck.count;
    });

    if (!result) throw new NotFoundException('Deck not found');
  }
}
