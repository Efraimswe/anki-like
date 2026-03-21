import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, deviceInfo: string | null, ipAddress: string | null) {
    const rawToken = crypto.randomUUID();
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshToken: hashedToken,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return { session, rawToken };
  }

  async findByUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findByRefreshToken(rawToken: string) {
    const hashedToken = this.hashToken(rawToken);
    return this.prisma.session.findUnique({
      where: { refreshToken: hashedToken },
    });
  }

  async updateLastActive(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async rotateRefreshToken(id: string) {
    const rawToken = crypto.randomUUID();
    const hashedToken = this.hashToken(rawToken);
    await this.prisma.session.update({
      where: { id },
      data: { refreshToken: hashedToken, lastActiveAt: new Date() },
    });
    return rawToken;
  }

  async delete(id: string) {
    return this.prisma.session.delete({ where: { id } });
  }

  async deleteAllForUser(userId: string) {
    return this.prisma.session.deleteMany({ where: { userId } });
  }
}
