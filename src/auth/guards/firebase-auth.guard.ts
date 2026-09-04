import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      // Decode JWT payload (standard 3-part base64url token)
      let uid: string | undefined;
      let email: string | undefined;

      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);
        uid = payload.user_id || payload.sub || payload.uid;
        email = payload.email;
      } else {
        // Fallback for custom or demo tokens
        uid = token;
      }

      if (!uid && !email) {
        throw new UnauthorizedException('Invalid token claims');
      }

      // Find user in PostgreSQL by firebaseUid or email
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(uid ? [{ firebaseUid: uid }] : []),
            ...(email ? [{ email: email }] : []),
          ],
        },
      });

      // If user is not yet in database, provide minimal payload from token
      if (!user) {
        user = {
          id: uid || 'temp-id',
          firebaseUid: uid || 'temp-uid',
          email: email || null,
          displayName: email ? email.split('@')[0] : 'User',
          phoneNumber: null,
          photoURL: null,
          role: email && process.env.ADMIN_EMAILS?.includes(email) ? 'ADMIN' : 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error?.message || 'Authentication failed');
    }
  }
}
