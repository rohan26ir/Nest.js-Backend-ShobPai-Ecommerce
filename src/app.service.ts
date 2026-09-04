import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'ok',
      message: 'ShobPai E-Commerce API is running smoothly',
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
