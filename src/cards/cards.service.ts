import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto, CardType } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(deckId: string, dto: CreateCardDto) {
    // Verify deck exists
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, deletedAt: null },
    });
    if (!deck) throw new NotFoundException('Deck not found');

    // Validate cloze syntax
    if (dto.type === CardType.CLOZE) {
      if (!dto.front.includes('{{') || !dto.front.includes('}}')) {
        throw new BadRequestException(
          'Cloze cards must contain at least one {{answer}} deletion',
        );
      }
    }

    const tags = dto.tags || [];

    if (dto.type === CardType.REVERSE) {
      return this.prisma.$transaction(async (tx) => {
        // Forward card
        const fwd = await tx.card.create({
          data: { deckId, front: dto.front, back: dto.back, type: 'reverse', tags },
          select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
        });
        await tx.cardState.create({ data: { cardId: fwd.id } });

        // Reverse card
        const rev = await tx.card.create({
          data: { deckId, front: dto.back, back: dto.front, type: 'reverse', tags, sourceCardId: fwd.id },
          select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
        });
        await tx.cardState.create({ data: { cardId: rev.id } });

        return [fwd, rev];
      });
    }

    // Basic or Cloze card
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: { deckId, front: dto.front, back: dto.back, type: dto.type, tags },
        select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
      });
      await tx.cardState.create({ data: { cardId: card.id } });
      return card;
    });
  }

  async findByDeck(
    deckId: string,
    options: { tag?: string; page?: number; limit?: number } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { deckId, deletedAt: null };
    if (options.tag) {
      where.tags = { has: options.tag };
    }

    const [data, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
      }),
      this.prisma.card.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByTag(tag: string) {
    const cards = await this.prisma.card.findMany({
      where: { tags: { has: tag }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true },
    });
    return cards;
  }

  async findOne(id: string) {
    const card = await this.prisma.card.findFirst({
      where: { id, deletedAt: null },
      include: { cardState: true },
    });
    if (!card) throw new NotFoundException('Card not found');

    return {
      id: card.id,
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      type: card.type,
      tags: card.tags,
      state: card.cardState
        ? {
            phase: card.cardState.phase,
            interval: card.cardState.interval,
            easeFactor: card.cardState.easeFactor,
            repetitions: card.cardState.repetitions,
            dueDate: card.cardState.dueDate,
          }
        : null,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  async update(id: string, dto: UpdateCardDto) {
    const existing = await this.prisma.card.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Card not found');

    const card = await this.prisma.card.update({
      where: { id },
      data: {
        front: dto.front ?? undefined,
        back: dto.back ?? undefined,
        tags: dto.tags ?? undefined,
        updatedAt: new Date(),
      },
      select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true, updatedAt: true },
    });
    return card;
  }

  async remove(id: string) {
    const result = await this.prisma.card.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Card not found');
  }
}
