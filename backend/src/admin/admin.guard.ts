import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

/**
 * Allows the request only if the authenticated user is an admin. Must run
 * after JwtAuthGuard (which populates request.user).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const authUser = request.user;
    if (!authUser) {
      throw new ForbiddenException('Authentication required');
    }
    const user = await this.users.findById(authUser.id);
    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
