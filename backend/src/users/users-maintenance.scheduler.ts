import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { rm } from 'fs/promises';
import { isAbsolute, join } from 'path';

import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SOFT_DELETE_DAYS = 30;

/**
 * Account lifecycle maintenance. Accounts are soft-deleted by setting
 * `deletedAt` (the user-facing delete flow lands in a later block); this cron
 * permanently removes them once they are older than the grace window so the
 * user has a chance to recover, while still honouring the deletion eventually.
 */
@Injectable()
export class UsersMaintenanceScheduler {
  private readonly logger = new Logger(UsersMaintenanceScheduler.name);
  private readonly softDeleteDays: number;
  private readonly uploadsDir: string;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const configured = Number(config.get('SOFT_DELETE_DAYS', DEFAULT_SOFT_DELETE_DAYS));
    this.softDeleteDays =
      Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_SOFT_DELETE_DAYS;
    const dir = config.get<string>('UPLOADS_DIR', './uploads');
    this.uploadsDir = isAbsolute(dir) ? dir : join(process.cwd(), dir);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeSoftDeletedAccounts(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const cutoff = new Date(Date.now() - this.softDeleteDays * DAY_MS);
      const expired = await this.prisma.user.findMany({
        where: { deletedAt: { not: null, lt: cutoff } },
        select: { id: true },
      });
      if (expired.length === 0) return;

      // Remove each user's uploads from disk before the DB cascade.
      for (const { id } of expired) {
        await rm(join(this.uploadsDir, id), { recursive: true, force: true }).catch((err) =>
          this.logger.warn(`Could not remove uploads for ${id}: ${(err as Error).message}`),
        );
      }

      const { count } = await this.prisma.user.deleteMany({
        where: { id: { in: expired.map((u) => u.id) } },
      });
      if (count > 0) {
        this.logger.log(
          `Hard-deleted ${count} account(s) soft-deleted before ${cutoff.toISOString()} ` +
            `(grace window: ${this.softDeleteDays}d)`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Failed to purge soft-deleted accounts',
        err instanceof Error ? err.stack : err,
      );
    } finally {
      this.running = false;
    }
  }
}
