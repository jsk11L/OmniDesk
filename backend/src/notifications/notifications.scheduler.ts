import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { parseExpression } from 'cron-parser';
import type { NotificationConfig } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { hhmmToMinutes, localTime } from './dnd.util';

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
    if (all.length > 0) {
      this.logger.log(
        `Tick @ ${now.toISOString()}: firing ${all.length} notification(s) ` +
          `(${scheduled.length} scheduled, ${recurring.length} recurring)`,
      );
      for (const config of all) {
        await this.safeDeliver(config);
      }
    }

    await this.processContextualTriggers(now);
  }

  private async safeDeliver(config: NotificationConfig): Promise<void> {
    try {
      await this.notifications.deliver(config);
    } catch (err) {
      this.logger.error(
        `Failed to deliver notification ${config.id} (${config.title})`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  private sameMinute(a: Date, b: Date): boolean {
    return Math.floor(a.getTime() / 60000) === Math.floor(b.getTime() / 60000);
  }

  /**
   * Fires notifications attached to entities with time semantics. The one-minute
   * tick + minute-granularity match means each occurrence fires exactly once
   * during normal operation (a missed tick simply skips that minute — preferred
   * over duplicates). SavingsGoal/ListItem/WishlistItem are event- or
   * config-scheduled and not handled here.
   */
  private async processContextualTriggers(now: Date): Promise<void> {
    // TodoItem: fire `minutesBefore` ahead of the due date.
    const todoNotifs = await this.prisma.todoItemNotification.findMany({
      where: { notification: { isActive: true }, todoItem: { dueDate: { not: null } } },
      include: { todoItem: true, notification: true },
    });
    for (const n of todoNotifs) {
      if (!n.todoItem.dueDate) continue;
      const target = new Date(n.todoItem.dueDate.getTime() - (n.minutesBefore ?? 0) * 60_000);
      if (this.sameMinute(target, now)) await this.safeDeliver(n.notification);
    }

    // PlannedPurchase: fire `daysBefore` ahead of the target date.
    const plannedNotifs = await this.prisma.plannedPurchaseNotification.findMany({
      where: { notification: { isActive: true }, plannedPurchase: { isPurchased: false } },
      include: { plannedPurchase: true, notification: true },
    });
    for (const n of plannedNotifs) {
      const target = new Date(
        n.plannedPurchase.targetDate.getTime() - (n.daysBefore ?? 0) * 86_400_000,
      );
      if (this.sameMinute(target, now)) await this.safeDeliver(n.notification);
    }

    // Habit: fire at `timeOfDay` in the user's local time, on active weekdays.
    const habitNotifs = await this.prisma.habitNotification.findMany({
      where: { timeOfDay: { not: null }, notification: { isActive: true } },
      include: {
        habit: { include: { user: { select: { timezone: true } } } },
        notification: true,
      },
    });
    for (const n of habitNotifs) {
      if (!n.timeOfDay) continue;
      const { minutes, day } = localTime(now, n.habit.user.timezone);
      if (hhmmToMinutes(n.timeOfDay) === minutes && n.habit.activeDays.includes(day)) {
        await this.safeDeliver(n.notification);
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
