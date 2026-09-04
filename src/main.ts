import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import express, { Express, Request, Response } from 'express';

const server: Express = express();
let isReady = false;

export async function createNestApp(expressInstance: Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  // Global prefix for all endpoints: /api/..., excluding root '/' for health checks
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // CORS configuration for local development & deployed frontends
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI Swagger Documentation at /api/docs
  const config = new DocumentBuilder()
    .setTitle('ShobPai E-Commerce API')
    .setDescription('Full REST API for ShobPai E-Commerce Platform with Neon PostgreSQL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Local development server bootstrap (only when not running in Vercel Serverless)
async function bootstrap() {
  const app = await createNestApp(server);
  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 ShobPai Backend running on http://localhost:${port}/api`);
  console.log(`📚 Swagger documentation at http://localhost:${port}/api/docs`);
}

if (!process.env.VERCEL) {
  bootstrap();
}

// Serverless export for Vercel
export default async function handler(req: Request, res: Response) {
  try {
    if (!isReady) {
      await createNestApp(server);
      isReady = true;
    }
    server(req, res);
  } catch (error: any) {
    console.error('Serverless error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error?.message || String(error),
    });
  }
}
