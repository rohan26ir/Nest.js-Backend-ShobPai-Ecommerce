import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Strip accidental quotes or whitespace from environment variables (e.g. from Vercel dashboard)
    const rawUrl = process.env.DATABASE_URL;
    const cleanUrl = rawUrl ? rawUrl.replace(/^["'\s]+|["'\s]+$/g, '') : undefined;
    if (cleanUrl) {
      process.env.DATABASE_URL = cleanUrl;
    }

    const rawDirect = process.env.DIRECT_URL;
    const cleanDirect = rawDirect ? rawDirect.replace(/^["'\s]+|["'\s]+$/g, '') : undefined;
    if (cleanDirect) {
      process.env.DIRECT_URL = cleanDirect;
    }

    super({
      ...(cleanUrl ? { datasources: { db: { url: cleanUrl } } } : {}),
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Connected to Neon PostgreSQL via Prisma');
    } catch (error) {
      console.warn('⚠️ Neon PostgreSQL connection pending:', error?.message || error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
