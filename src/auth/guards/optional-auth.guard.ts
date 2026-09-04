import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      let uid: string | undefined;
      let email: string | undefined;

      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);
        uid = payload.user_id || payload.sub || payload.uid;
        email = payload.email;
      } else {
        uid = token;
      }

      if (uid || email) {
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              ...(uid ? [{ firebaseUid: uid }] : []),
              ...(email ? [{ email: email }] : []),
            ],
          },
        });
        request.user = user || null;
      }
    } catch {
      request.user = null;
    }

    return true;
  }
}
