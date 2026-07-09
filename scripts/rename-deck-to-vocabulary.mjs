// One-shot, guarded rename of the single deck to "Vocabulary".
// Dry-run by default; pass --apply to write. Only touches the `name` field.
// Run: node --env-file=.env scripts/rename-deck-to-vocabulary.mjs [--apply]
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const TARGET_NAME = 'Vocabulary';
const prisma = new PrismaClient();

try {
  const decks = await prisma.deck.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  const count = decks.length;

  console.log(`Live decks (deletedAt = null): ${count}`);
  for (const d of decks) console.log(`  - ${d.id}  "${d.name}"`);

  if (count !== 1) {
    console.error(`STOP: expected exactly 1 deck, found ${count}. Nothing changed.`);
    process.exit(1);
  }

  const deck = decks[0];
  // Card-count sanity snapshot, so before/after can be compared. Read-only.
  const cardCount = await prisma.card.count({ where: { deckId: deck.id, deletedAt: null } });
  console.log(`Cards in deck (deletedAt = null): ${cardCount}`);

  if (!APPLY) {
    console.log(`DRY-RUN: would rename "${deck.name}" -> "${TARGET_NAME}". No write performed.`);
    console.log('Re-run with --apply to perform the rename.');
    process.exit(0);
  }

  if (deck.name === TARGET_NAME) {
    console.log(`Deck already named "${TARGET_NAME}". No write needed.`);
    process.exit(0);
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { name: TARGET_NAME },
    select: { id: true, name: true },
  });
  console.log(`APPLIED: renamed to "${updated.name}" (id ${updated.id}).`);
} catch (err) {
  console.error('FAILED:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
