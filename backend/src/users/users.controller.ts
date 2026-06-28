import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.users.findById(user.id);
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      avatarUrl: found.avatarUrl,
      isEmailVerified: found.isEmailVerified,
      isAdmin: found.isAdmin,
      activeThemeId: found.activeThemeId,
      createdAt: found.createdAt,
    };
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    const updated = await this.users.updateProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      isEmailVerified: updated.isEmailVerified,
      isAdmin: updated.isAdmin,
      activeThemeId: updated.activeThemeId,
      createdAt: updated.createdAt,
    };
  }
}
