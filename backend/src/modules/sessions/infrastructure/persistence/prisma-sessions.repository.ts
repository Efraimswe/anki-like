import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { SessionsRepository } from '../../domain/ports/sessions.repository';

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    refreshToken: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({ data });
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

  async findByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({ where: { refreshToken } });
  }

  async updateLastActive(id: string) {
    await this.prisma.session.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    await this.prisma.session.update({
      where: { id },
      data: { refreshToken, lastActiveAt: new Date() },
    });
  }

  async delete(id: string) {
    await this.prisma.session.delete({ where: { id } });
  }

  async deleteAllForUser(userId: string) {
    const result = await this.prisma.session.deleteMany({ where: { userId } });
    return result.count;
  }
}
