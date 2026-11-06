import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MODERATOR: 50,
  CUSTOMER: 10,
  USER: 10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(Role | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const userRoleLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredRoleLevels = requiredRoles.map(
      (role) => ROLE_HIERARCHY[String(role)] ?? 0,
    );

    // Pass if user's role is specifically listed OR has equal/higher authority than the lowest required level
    const exactMatch = requiredRoles.some((role) => String(user.role) === String(role));
    const hierarchyMatch = requiredRoleLevels.some((reqLevel) => userRoleLevel >= reqLevel);

    if (!exactMatch && !hierarchyMatch) {
      throw new ForbiddenException(
        `Access denied. Requires one of roles: [${requiredRoles.join(', ')}]. Current role: ${user.role}`,
      );
    }

    return true;
  }
}
