import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import {
  PersistReviewInput,
  ReviewsRepository,
} from '../../domain/ports/reviews.repository';

@Injectable()
export class PrismaReviewsRepository implements ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDeckForUser(userId: string, deckId: string) {
    return this.prisma.deck.findFirst({
      where: { id: deckId, userId, deletedAt: null },
      select: { id: true },
    });
  }

  async findDueReviewCards(
    userId: string,
    deckId: string,
    effectiveLimit: number,
    learningCutoff: Date,
    now: Date,
  ) {
    return this.prisma.card.findMany({
      where: {
        deckId,
        deletedAt: null,
        deck: { userId },
        cardState: {
          phase: { not: 'new' },
          OR: [
            { dueDate: { lte: now } },
            { phase: { in: ['learning', 'relearning'] }, dueDate: { lte: learningCutoff } },
          ],
        },
      },
      orderBy: { cardState: { dueDate: 'asc' } },
      take: effectiveLimit,
      select: {
        id: true,
        front: true,
        back: true,
        type: true,
        cardState: {
          select: {
            phase: true,
            dueDate: true,
            interval: true,
            easeFactor: true,
            repetitions: true,
            learningStep: true,
          },
        },
      },
    });
  }

  async findNewCards(userId: string, deckId: string, limit: number) {
    return this.prisma.card.findMany({
      where: { deckId, deletedAt: null, deck: { userId }, cardState: { phase: 'new' } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        front: true,
        back: true,
        type: true,
        cardState: {
          select: {
            phase: true,
            dueDate: true,
            interval: true,
            easeFactor: true,
            repetitions: true,
            learningStep: true,
          },
        },
      },
    });
  }

  async findNextDueCard(userId: string, deckId: string, now: Date) {
    return this.prisma.card.findFirst({
      where: {
        deckId,
        deletedAt: null,
        deck: { userId },
        cardState: { dueDate: { gt: now } },
      },
      orderBy: { cardState: { dueDate: 'asc' } },
      select: { cardState: { select: { dueDate: true } } },
    });
  }

  async findReviewableCardState(cardId: string) {
    return this.prisma.cardState.findUnique({
      where: { cardId },
      include: { card: { select: { deletedAt: true, deck: { select: { userId: true } } } } },
    });
  }

  async persistReview(input: PersistReviewInput) {
    await this.prisma.$transaction(async (tx) => {
      await tx.cardState.update({
        where: { cardId: input.cardId },
        data: {
          interval: input.newState.interval,
          easeFactor: input.newState.easeFactor,
          repetitions: input.newState.repetitions,
          learningStep: input.newState.learningStep,
          dueDate: input.newState.dueDate,
          phase: input.newState.phase,
          updatedAt: new Date(),
        },
      });

      await tx.reviewLog.create({
        data: {
          cardId: input.cardId,
          rating: input.rating,
          intervalBefore: input.previousState.interval,
          intervalAfter: input.newState.interval,
          easeBefore: input.previousState.easeFactor,
          easeAfter: input.newState.easeFactor,
          timeTakenMs: input.timeTakenMs || null,
        },
      });

      await tx.dailyCounter.upsert({
        where: { userId_date: { userId: input.userId, date: this.startOfUtcDay(new Date()) } },
        create: {
          userId: input.userId,
          date: this.startOfUtcDay(new Date()),
          newCount: input.isNewCard ? 1 : 0,
          reviewCount: 1,
        },
        update: {
          newCount: { increment: input.isNewCard ? 1 : 0 },
          reviewCount: { increment: 1 },
        },
      });
    });
  }

  private startOfUtcDay(date: Date) {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
}
