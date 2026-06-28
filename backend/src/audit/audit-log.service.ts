import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records significant/destructive events (account deletion, suspension,
 * import/export, 2FA changes). Writing a log must NEVER break the action that
 * triggered it, so failures are swallowed and logged.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log "${entry.action}"`, err as Error);
    }
  }

  async list(page = 1, limit = 50): Promise<{ items: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, limit: take, totalPages: Math.ceil(total / take) || 1 };
  }
}
