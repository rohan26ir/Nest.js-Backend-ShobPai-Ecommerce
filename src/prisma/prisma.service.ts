import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
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
