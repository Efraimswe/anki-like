import { PrismaClient, Prisma } from '@prisma/client';
const p = new PrismaClient();
const matches = await p.user.count({
  where: { skillLevels: { equals: Prisma.DbNull }, onboardingCompleted: true },
});
console.log(`Users with skillLevels=NULL AND onboarded=true: ${matches}`);
const result = await p.user.updateMany({
  where: { skillLevels: { equals: Prisma.DbNull }, onboardingCompleted: true },
  data: { onboardingCompleted: false },
});
console.log(`Updated ${result.count} users (onboarding_completed -> false)`);
await p.$disconnect();
