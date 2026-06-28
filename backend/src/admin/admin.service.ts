import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { MailService } from '../mail/mail.service';
import type { RequestMeta } from '../auth/auth.service';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  isEmailVerified: true,
  isAdmin: true,
  isSuspended: true,
  deletedAt: true,
  totpEnabledAt: true,
  lastLoginAt: true,
  uploadBytesUsed: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

function serialize(user: Record<string, unknown>): Record<string, unknown> {
  // uploadBytesUsed is a BigInt; make it JSON-safe.
  return { ...user, uploadBytesUsed: Number(user['uploadBytesUsed'] ?? 0) };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly mail: MailService,
  ) {}

  async listUsers(page = 1, limit = 25, q?: string) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const where: Prisma.UserWhereInput = q
      ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: PUBLIC_USER_SELECT, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: rows.map(serialize),
      total,
      page: Math.max(page, 1),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return serialize(user);
  }

  async suspend(id: string, adminId: string, meta?: RequestMeta) {
    if (id === adminId) throw new ForbiddenException('You cannot suspend your own account');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { isSuspended: true } });
    await this.audit.log({ userId: adminId, action: 'admin.user_suspended', entityType: 'User', entityId: id, ...meta });
    try {
      await this.mail.sendNotificationEmail(
        user.email,
        'Your OmniDesk account was suspended',
        'An administrator has suspended your account. If you believe this is a mistake, reply to this email.',
      );
    } catch {
      /* mail best-effort */
    }
    return { message: 'User suspended' };
  }

  async unsuspend(id: string, adminId: string, meta?: RequestMeta) {
    await this.prisma.user.update({ where: { id }, data: { isSuspended: false } }).catch(() => {
      throw new NotFoundException('User not found');
    });
    await this.audit.log({ userId: adminId, action: 'admin.user_unsuspended', entityType: 'User', entityId: id, ...meta });
    return { message: 'User unsuspended' };
  }

  async deleteUser(id: string, adminId: string, meta?: RequestMeta) {
    if (id === adminId) throw new BadRequestException('Use your own account settings to delete your account');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId: adminId, action: 'admin.user_deleted', entityType: 'User', entityId: id, ...meta });
    return { message: 'User scheduled for deletion' };
  }

  async disableTwoFactor(id: string, adminId: string, meta?: RequestMeta) {
    await this.prisma.user
      .update({ where: { id }, data: { totpSecret: null, totpEnabledAt: null, totpBackupCodes: [] } })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
    await this.audit.log({ userId: adminId, action: 'admin.user_2fa_disabled', entityType: 'User', entityId: id, ...meta });
    return { message: '2FA disabled for user' };
  }

  async stats() {
    const [total, admins, suspended, verified, pendingDeletion, twoFactor] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAdmin: true } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.user.count({ where: { isEmailVerified: true } }),
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.user.count({ where: { totpEnabledAt: { not: null } } }),
    ]);
    return { total, admins, suspended, verified, pendingDeletion, twoFactor };
  }

  auditLog(page = 1, limit = 50) {
    return this.audit.list(page, limit);
  }
}
