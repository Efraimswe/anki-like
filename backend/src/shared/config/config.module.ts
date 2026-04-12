import { Module, Global } from '@nestjs/common';

@Global()
@Module({})
export class ConfigModule {
  static getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    return url;
  }
}
