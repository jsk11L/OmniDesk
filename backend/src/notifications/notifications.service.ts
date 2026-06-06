import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import type {
  InAppNotification,
  NotificationConfig,
  Prisma,
  PushSubscription,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { isPushSuppressed } from './dnd.util';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  PushSubscriptionDto,
  UnsubscribePushDto,
} from './dto/push-subscription.dto';

export interface FireResult {
  inAppCreated: boolean;
  pushSent: number;
  emailsSent: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private pushEnabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY', '');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY', '');
    const subject = this.config.get<string>('VAPID_SUBJECT', '');

    const placeholderDetected =
      !publicKey ||
      !privateKey ||
      !subject ||
      publicKey.startsWith('CHANGE_ME') ||
      privateKey.startsWith('CHANGE_ME');

    if (placeholderDetected) {
      this.logger.warn('VAPID keys not configured. Web push disabled until set.');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.pushEnabled = true;
    this.logger.log('Web push enabled (VAPID configured)');
  }

  // ─── Configs ─────────────────────────────────────────────

  list(userId: string): Promise<NotificationConfig[]> {
    return this.prisma.notificationConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string): Promise<NotificationConfig> {
    const config = await this.prisma.notificationConfig.findFirst({
      where: { id, userId },
    });
    if (!config) {
      throw new NotFoundException('Notification not found');
    }
    return config;
  }

  create(userId: string, dto: CreateNotificationDto): Promise<NotificationConfig> {
    this.validateTriggerFields(dto.triggerType, dto.scheduledAt, dto.recurringRule);

    return this.prisma.notificationConfig.create({
      data: {
        userId,
        title: dto.title,
        message: dto.message,
        iconUrl: dto.iconUrl ?? null,
        accentColor: dto.accentColor ?? '#6366f1',
        triggerType: dto.triggerType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        recurringRule: dto.recurringRule ?? null,
        isRecurring: dto.isRecurring ?? dto.triggerType === 'RECURRING',
        channels: dto.channels,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationConfig> {
    const existing = await this.findById(userId, id);
    const triggerType = dto.triggerType ?? existing.triggerType;
    const scheduledAt =
      dto.scheduledAt !== undefined
        ? dto.scheduledAt
        : existing.scheduledAt?.toISOString();
    const recurringRule =
      dto.recurringRule !== undefined ? dto.recurringRule : existing.recurringRule;
    this.validateTriggerFields(triggerType, scheduledAt ?? undefined, recurringRule ?? undefined);

    return this.prisma.notificationConfig.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        message: dto.message ?? existing.message,
        iconUrl: dto.iconUrl ?? existing.iconUrl,
        accentColor: dto.accentColor ?? existing.accentColor,
        triggerType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recurringRule: recurringRule ?? null,
        isRecurring: dto.isRecurring ?? existing.isRecurring,
        channels: dto.channels ?? existing.channels,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    await this.findById(userId, id);
    await this.prisma.notificationConfig.delete({ where: { id } });
    return { id };
  }

  // ─── Manual fire ─────────────────────────────────────────

  async fire(userId: string, id: string): Promise<FireResult> {
    const config = await this.findById(userId, id);
    return this.deliver(config);
  }

  async deliver(config: NotificationConfig): Promise<FireResult> {
    const result: FireResult = { inAppCreated: false, pushSent: 0, emailsSent: 0 };

    // Record the in-app notification and the fired marker atomically. If either
    // failed independently, a stale lastFiredAt would let the next scheduler
    // tick re-fire and duplicate the inbox entry for RECURRING configs (§2.5 #8).
    await this.prisma.$transaction(async (tx) => {
      if (config.channels.includes('IN_APP')) {
        await tx.inAppNotification.create({
          data: { userId: config.userId, notificationId: config.id, isRead: false },
        });
        result.inAppCreated = true;
      }

      await tx.notificationConfig.update({
        where: { id: config.id },
        data: {
          lastFiredAt: new Date(),
          isFired: config.triggerType === 'SCHEDULED' ? true : config.isFired,
        },
      });
    });

    // External, best-effort side effects. They run after the fired marker is
    // committed so a transient push/email failure can never trigger a re-fire.
    const needsUser = config.channels.includes('PUSH') || config.channels.includes('EMAIL');
    const user = needsUser ? await this.users.findById(config.userId) : null;

    if (config.channels.includes('PUSH') && this.pushEnabled && user) {
      // Do-not-disturb only suppresses push; the in-app entry above still queues.
      const suppressed = isPushSuppressed(
        {
          timezone: user.timezone,
          dndStart: user.dndStart,
          dndEnd: user.dndEnd,
          quietDays: user.quietDays,
        },
        new Date(),
      );
      if (!suppressed) {
        result.pushSent = await this.sendPushToUser(config);
      }
    }

    if (config.channels.includes('EMAIL') && user) {
      await this.mail.sendNotificationEmail(
        user.email,
        config.title,
        config.message,
        config.iconUrl,
        config.accentColor,
      );
      result.emailsSent = 1;
    }

    return result;
  }

  // ─── Preferences (DND + timezone) ────────────────────────

  private readonly PREF_SELECT = {
    timezone: true,
    dndStart: true,
    dndEnd: true,
    quietDays: true,
  } as const;

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.PREF_SELECT,
    });
    return user ?? { timezone: null, dndStart: null, dndEnd: null, quietDays: [] };
  }

  async updatePreferences(
    userId: string,
    dto: {
      timezone?: string;
      dndStart?: string | null;
      dndEnd?: string | null;
      quietDays?: number[];
    },
  ) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.timezone !== undefined) data.timezone = dto.timezone || null;
    if (dto.dndStart !== undefined) data.dndStart = dto.dndStart;
    if (dto.dndEnd !== undefined) data.dndEnd = dto.dndEnd;
    if (dto.quietDays !== undefined) data.quietDays = dto.quietDays;
    return this.prisma.user.update({ where: { id: userId }, data, select: this.PREF_SELECT });
  }

  // ─── Inbox ───────────────────────────────────────────────

  listInbox(userId: string): Promise<InAppNotification[]> {
    return this.prisma.inAppNotification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      include: { notification: true },
    });
  }

  async markAsRead(userId: string, id: string): Promise<InAppNotification> {
    const item = await this.prisma.inAppNotification.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundException('Inbox entry not found');
    }
    return this.prisma.inAppNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async clearInbox(userId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.inAppNotification.deleteMany({
      where: { userId, isRead: true },
    });
    return { deleted: result.count };
  }

  // ─── Push subscriptions ──────────────────────────────────

  async subscribePush(
    userId: string,
    dto: PushSubscriptionDto,
    userAgent?: string | null,
  ): Promise<PushSubscription> {
    const platform = detectPlatform(userAgent);
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
        deviceLabel: dto.deviceLabel ?? null,
        platform,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? undefined,
        deviceLabel: dto.deviceLabel ?? undefined,
        platform,
      },
    });
  }

  listDevices(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, deviceLabel: true, platform: true, userAgent: true, lastUsedAt: true, createdAt: true },
    });
  }

  async removeDevice(userId: string, id: string): Promise<{ id: string }> {
    await this.prisma.pushSubscription.deleteMany({ where: { id, userId } });
    return { id };
  }

  async unsubscribePush(
    userId: string,
    dto: UnsubscribePushDto,
  ): Promise<{ endpoint: string }> {
    const existing = await this.prisma.pushSubscription.findFirst({
      where: { endpoint: dto.endpoint, userId },
    });
    if (!existing) {
      throw new NotFoundException('Push subscription not found');
    }
    await this.prisma.pushSubscription.delete({ where: { endpoint: dto.endpoint } });
    return { endpoint: dto.endpoint };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private validateTriggerFields(
    triggerType: NotificationConfig['triggerType'],
    scheduledAt: string | undefined,
    recurringRule: string | null | undefined,
  ): void {
    if (triggerType === 'SCHEDULED' && !scheduledAt) {
      throw new BadRequestException('scheduledAt is required when triggerType is SCHEDULED');
    }
    if (triggerType === 'RECURRING' && !recurringRule) {
      throw new BadRequestException('recurringRule is required when triggerType is RECURRING');
    }
  }

  private async sendPushToUser(config: NotificationConfig): Promise<number> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: config.userId },
    });

    const payload = JSON.stringify({
      title: config.title,
      body: config.message,
      icon: config.iconUrl ?? null,
      accentColor: config.accentColor,
      notificationId: config.id,
    });

    const expired: string[] = [];
    let sent = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
          sent += 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            expired.push(sub.endpoint);
          } else {
            this.logger.error(`Push send failed for ${sub.endpoint}`, err as Error);
          }
        }
      }),
    );

    if (expired.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expired } },
      });
      this.logger.log(`Removed ${expired.length} expired push subscriptions`);
    }

    return sent;
  }
}

function detectPlatform(ua?: string | null): string {
  if (!ua) return 'unknown';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}
