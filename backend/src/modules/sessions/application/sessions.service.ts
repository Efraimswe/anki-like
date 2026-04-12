import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SessionsRepository } from '../domain/ports/sessions.repository';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, deviceInfo: string | null, ipAddress: string | null) {
    const rawToken = crypto.randomUUID();
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.sessionsRepository.create({
      userId,
      refreshToken: hashedToken,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    return { session, rawToken };
  }

  async findByUser(userId: string) {
    return this.sessionsRepository.findByUser(userId);
  }

  async findById(id: string) {
    return this.sessionsRepository.findById(id);
  }

  async findByRefreshToken(rawToken: string) {
    const hashedToken = this.hashToken(rawToken);
    return this.sessionsRepository.findByRefreshToken(hashedToken);
  }

  async updateLastActive(id: string) {
    await this.sessionsRepository.updateLastActive(id);
  }

  async rotateRefreshToken(id: string) {
    const rawToken = crypto.randomUUID();
    const hashedToken = this.hashToken(rawToken);
    await this.sessionsRepository.updateRefreshToken(id, hashedToken);
    return rawToken;
  }

  async delete(id: string) {
    await this.sessionsRepository.delete(id);
  }

  async deleteAllForUser(userId: string) {
    return this.sessionsRepository.deleteAllForUser(userId);
  }
}
