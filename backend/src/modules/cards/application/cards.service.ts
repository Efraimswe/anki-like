import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DecksRepository } from '../../decks/domain/ports/decks.repository';
import { CardsRepository } from '../domain/ports/cards.repository';
import { CreateCardDto, CardType } from '../infrastructure/http/dto/create-card.dto';
import { UpdateCardDto } from '../infrastructure/http/dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly decksRepository: DecksRepository,
  ) {}

  async create(userId: string, deckId: string, dto: CreateCardDto) {
    const deckExists = await this.decksRepository.existsForUser(userId, deckId);
    if (!deckExists) throw new NotFoundException('Deck not found');

    if (dto.type === CardType.CLOZE) {
      if (!dto.front.includes('{{') || !dto.front.includes('}}')) {
        throw new BadRequestException(
          'Cloze cards must contain at least one {{answer}} deletion',
        );
      }
    }

    const tags = dto.tags || [];

    if (dto.type === CardType.REVERSE) {
      return this.cardsRepository.createReverseCardsWithState({
        deckId,
        front: dto.front,
        back: dto.back,
        tags,
      });
    }

    return this.cardsRepository.createBasicCardWithState({
      deckId,
      front: dto.front,
      back: dto.back,
      type: dto.type,
      tags,
    });
  }

  async findByDeck(
    userId: string,
    deckId: string,
    options: { tag?: string; page?: number; limit?: number } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const { data, total } = await this.cardsRepository.findByDeck(userId, deckId, {
      tag: options.tag,
      page,
      limit,
    });

    return { data, total, page, limit };
  }

  async findAllForUser(userId: string) {
    return this.cardsRepository.findAllForUser(userId);
  }

  async findByTag(userId: string, tag: string) {
    return this.cardsRepository.findByTag(userId, tag);
  }

  async findOne(userId: string, id: string) {
    const card = await this.cardsRepository.findOne(userId, id);
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

  async update(userId: string, id: string, dto: UpdateCardDto) {
    const existing = await this.cardsRepository.existsForUser(userId, id);
    if (!existing) throw new NotFoundException('Card not found');

    return this.cardsRepository.update(id, {
      front: dto.front ?? undefined,
      back: dto.back ?? undefined,
      tags: dto.tags ?? undefined,
      updatedAt: new Date(),
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.cardsRepository.existsForUser(userId, id);
    if (!existing) throw new NotFoundException('Card not found');

    await this.cardsRepository.softDelete(id, new Date());
  }
}
