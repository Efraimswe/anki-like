import { prisma } from './prisma';
import { buildDefaultDeckFsrsConfig } from './fsrs-defaults';

export async function ensureDeckFsrsConfig(deckId: string) {
  const defaults = buildDefaultDeckFsrsConfig();

  return prisma.deckFsrsConfig.upsert({
    where: { deckId },
    update: {},
    create: {
      deckId,
      desiredRetention: defaults.desiredRetention,
      maximumInterval: defaults.maximumInterval,
      weights: defaults.weights,
      learningSteps: defaults.learningSteps,
      relearningSteps: defaults.relearningSteps,
      isOptimized: defaults.isOptimized,
      lastOptimizedAt: defaults.lastOptimizedAt,
    },
  });
}
