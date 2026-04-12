import { Injectable, NotFoundException } from '@nestjs/common';
import { DecksRepository } from '../domain/ports/decks.repository';
import { CreateDeckDto } from '../infrastructure/http/dto/create-deck.dto';
import { UpdateDeckDto } from '../infrastructure/http/dto/update-deck.dto';

@Injectable()
export class DecksService {
  constructor(private readonly decksRepository: DecksRepository) {}

  async create(userId: string, dto: CreateDeckDto) {
    return this.decksRepository.create(userId, dto.name);
  }

  async findAll(userId: string) {
    const decks = await this.decksRepository.findAllByUser(userId);

    return decks.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt,
      cardCount: d.cards.length,
      dueCount: d.cards.filter(
        (c) => c.cardState?.dueDate !== null && c.cardState?.dueDate !== undefined && c.cardState.dueDate <= new Date(),
      ).length,
    }));
  }

  async findOne(userId: string, id: string) {
    const deck = await this.decksRepository.findOneByUser(userId, id);

    if (!deck) throw new NotFoundException('Deck not found');

    return {
      id: deck.id,
      name: deck.name,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      cardCount: deck.cards.length,
      dueCount: deck.cards.filter(
        (c) => c.cardState?.dueDate !== null && c.cardState?.dueDate !== undefined && c.cardState.dueDate <= new Date(),
      ).length,
      newCount: deck.cards.filter((c) => c.cardState && c.cardState.phase === 'new').length,
    };
  }

  async update(userId: string, id: string, dto: UpdateDeckDto) {
    const existing = await this.decksRepository.existsForUser(userId, id);
    if (!existing) throw new NotFoundException('Deck not found');

    return this.decksRepository.update(id, {
      name: dto.name ?? undefined,
      updatedAt: new Date(),
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.decksRepository.softDeleteWithCards(userId, id, new Date());

    if (!result) throw new NotFoundException('Deck not found');
  }
}
