import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import type { RequestMeta } from '../auth/auth.service';

function meta(req: Request): RequestMeta {
  return { ipAddress: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  async stats() {
    return { data: await this.admin.stats() };
  }

  @Get('users')
  async users(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    const result = await this.admin.listUsers(Number(page) || 1, Number(limit) || 25, q);
    return { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } };
  }

  @Get('users/:id')
  async user(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.admin.getUser(id) };
  }

  @Post('users/:id/suspend')
  suspend(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: AuthUser, @Req() req: Request) {
    return this.admin.suspend(id, admin.id, meta(req));
  }

  @Post('users/:id/unsuspend')
  unsuspend(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: AuthUser, @Req() req: Request) {
    return this.admin.unsuspend(id, admin.id, meta(req));
  }

  @Post('users/:id/disable-2fa')
  disable2fa(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: AuthUser, @Req() req: Request) {
    return this.admin.disableTwoFactor(id, admin.id, meta(req));
  }

  @Delete('users/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: AuthUser, @Req() req: Request) {
    return this.admin.deleteUser(id, admin.id, meta(req));
  }

  @Get('audit-log')
  async auditLog(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.admin.auditLog(Number(page) || 1, Number(limit) || 50);
    return { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } };
  }
}
