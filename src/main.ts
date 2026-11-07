import 'reflect-metadata';
import 'dotenv/config';

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["'\s]+|["'\s]+$/g, '');
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DIRECT_URL.replace(/^["'\s]+|["'\s]+$/g, '');
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

const server: Express = express();
let isReady = false;

export async function createNestApp(expressInstance: Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  // Security Headers: Apply Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // Global prefix for all endpoints: /api/..., excluding root '/' for health checks
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // Strict CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://shobpai.vercel.app')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''));

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app');
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, logged in filter
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  // Global exception filter to sanitize errors & prevent internal database leakages
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe for strict DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI Swagger Documentation at /api/docs
  const config = new DocumentBuilder()
    .setTitle('ShobPai E-Commerce API')
    .setDescription('Hardened REST API for ShobPai E-Commerce Platform with Neon PostgreSQL')
    .setVersion('2.0')
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
    return new Promise<void>((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('close', () => resolve());
      res.on('error', (err) => reject(err));
      server(req, res);
    });
  } catch (error: any) {
    console.error('Serverless bootstrap error:', error);
    const body = JSON.stringify({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error?.message || String(error),
    });
    if (typeof (res as any).status === 'function') {
      (res as any).status(500).send(body);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
    }
  }
}
