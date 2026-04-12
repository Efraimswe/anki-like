export interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionSummary {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  createdAt: Date;
}

export abstract class SessionsRepository {
  abstract create(data: {
    userId: string;
    refreshToken: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<SessionRecord>;
  abstract findByUser(userId: string): Promise<SessionSummary[]>;
  abstract findById(id: string): Promise<SessionRecord | null>;
  abstract findByRefreshToken(refreshToken: string): Promise<SessionRecord | null>;
  abstract updateLastActive(id: string): Promise<void>;
  abstract updateRefreshToken(id: string, refreshToken: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract deleteAllForUser(userId: string): Promise<number>;
}
