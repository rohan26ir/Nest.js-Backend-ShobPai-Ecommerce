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
import { AppModule } from '../src/app.module';
import express, { Express, Request, Response } from 'express';

const server: Express = express();
let isReady = false;

async function bootstrap() {
  if (!isReady) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    // Global prefix /api, excluding root '/' for health checks
    app.setGlobalPrefix('api', {
      exclude: ['/'],
    });

    app.enableCors({
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    isReady = true;
  }
  return server;
}

export default async function handler(req: Request, res: Response) {
  try {
    await bootstrap();
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
      message: 'Serverless Function Bootstrap Error',
      error: error?.message || String(error),
      stack: error?.stack,
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
