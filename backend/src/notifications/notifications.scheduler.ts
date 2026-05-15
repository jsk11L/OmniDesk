import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { parseExpression } from 'cron-parser';
import type { NotificationConfig } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous tick still running, skipping this run');
      return;
    }
    this.running = true;
    try {
      await this.processTick();
    } finally {
      this.running = false;
    }
  }

  private async processTick(): Promise<void> {
    const now = new Date();
    const [scheduled, recurring] = await Promise.all([
      this.findScheduledDue(now),
      this.findRecurringDue(now),
    ]);

    const all = [...scheduled, ...recurring];
    if (all.length === 0) return;

    this.logger.log(
      `Tick @ ${now.toISOString()}: firing ${all.length} notification(s) ` +
        `(${scheduled.length} scheduled, ${recurring.length} recurring)`,
    );

    for (const config of all) {
      try {
        await this.notifications.deliver(config);
      } catch (err) {
        this.logger.error(
          `Failed to deliver notification ${config.id} (${config.title})`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }

  private findScheduledDue(now: Date): Promise<NotificationConfig[]> {
    return this.prisma.notificationConfig.findMany({
      where: {
        isActive: true,
        triggerType: 'SCHEDULED',
        isFired: false,
        scheduledAt: { lte: now },
      },
    });
  }

  private async findRecurringDue(now: Date): Promise<NotificationConfig[]> {
    const candidates = await this.prisma.notificationConfig.findMany({
      where: {
        isActive: true,
        triggerType: 'RECURRING',
        recurringRule: { not: null },
      },
    });

    return candidates.filter((c) => this.isRecurringDue(c, now));
  }

  private isRecurringDue(config: NotificationConfig, now: Date): boolean {
    if (!config.recurringRule) return false;
    try {
      const reference = config.lastFiredAt ?? config.createdAt;
      const interval = parseExpression(config.recurringRule, { currentDate: reference });
      const next = interval.next().toDate();
      return next <= now;
    } catch (err) {
      this.logger.warn(
        `Invalid cron rule "${config.recurringRule}" on notification ${config.id}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
      return false;
    }
  }
}
