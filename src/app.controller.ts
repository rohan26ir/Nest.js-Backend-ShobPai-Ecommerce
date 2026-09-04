import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const dbUrlPrefix = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.slice(0, 20) + '...'
      : 'NOT_SET';

    try {
      const productCount = await this.prisma.product.count();
      const categoryCount = await this.prisma.category.count();
      return {
        status: 'healthy',
        database: 'connected',
        hasDbUrl,
        dbUrlPrefix,
        counts: { products: productCount, categories: categoryCount },
      };
    } catch (err: any) {
      return {
        status: 'database_error',
        hasDbUrl,
        dbUrlPrefix,
        errorName: err?.name,
        errorMessage: err?.message,
        errorCode: err?.code,
      };
    }
  }
}
