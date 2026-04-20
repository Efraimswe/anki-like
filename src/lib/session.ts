import crypto from 'crypto';
import { prisma } from './prisma';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, deviceInfo: string | null, ipAddress: string | null) {
  const rawToken = crypto.randomUUID();
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: { userId, refreshToken: hashedToken, deviceInfo, ipAddress, expiresAt },
  });

  return { session, rawToken };
}

export async function findSessionByRefreshToken(rawToken: string) {
  const hashedToken = hashToken(rawToken);
  return prisma.session.findFirst({ where: { refreshToken: hashedToken } });
}

export async function rotateRefreshToken(sessionId: string) {
  const rawToken = crypto.randomUUID();
  const hashedToken = hashToken(rawToken);
  await prisma.session.update({ where: { id: sessionId }, data: { refreshToken: hashedToken } });
  return rawToken;
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function getSessionsByUser(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    select: { id: true, deviceInfo: true, ipAddress: true, lastActiveAt: true, createdAt: true },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export function parseUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(ua);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return [browser.name, browser.version, 'on', os.name, os.version].filter(Boolean).join(' ');
  } catch {
    return ua.slice(0, 100);
  }
}
