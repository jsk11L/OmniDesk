import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type AttachEntityType =
  | 'calendar-event'
  | 'note'
  | 'list-item'
  | 'todo-item'
  | 'habit'
  | 'wishlist-item'
  | 'planned-purchase'
  | 'savings-goal';

export interface AttachOptions {
  minutesBefore?: number;
  timeOfDay?: string;
  daysBefore?: number;
}

type Extra = 'minutesBefore' | 'timeOfDay' | 'daysBefore';

interface EntityConfig {
  /** Prisma delegate name of the join table. */
  joinModel: string;
  /** FK column on the join table pointing at the entity. */
  fk: string;
  /** Optional timing fields this entity's join row accepts. */
  extras: Extra[];
  /** Verifies the entity exists and belongs to the user. */
  owned: (id: string, userId: string) => Promise<boolean>;
}

@Injectable()
export class AttachmentService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly registry: Record<AttachEntityType, EntityConfig> = {
    'calendar-event': {
      joinModel: 'calendarEventNotification',
      fk: 'eventId',
      extras: ['minutesBefore'],
      owned: (id, userId) => this.exists(this.prisma.calendarEvent.findFirst({ where: { id, userId } })),
    },
    note: {
      joinModel: 'noteNotification',
      fk: 'noteId',
      extras: [],
      owned: (id, userId) => this.exists(this.prisma.note.findFirst({ where: { id, userId } })),
    },
    'list-item': {
      joinModel: 'listItemNotification',
      fk: 'listItemId',
      extras: [],
      owned: (id, userId) =>
        this.exists(this.prisma.listItem.findFirst({ where: { id, list: { userId } } })),
    },
    'todo-item': {
      joinModel: 'todoItemNotification',
      fk: 'todoItemId',
      extras: ['minutesBefore'],
      owned: (id, userId) =>
        this.exists(this.prisma.todoItem.findFirst({ where: { id, column: { board: { userId } } } })),
    },
    habit: {
      joinModel: 'habitNotification',
      fk: 'habitId',
      extras: ['timeOfDay'],
      owned: (id, userId) => this.exists(this.prisma.habit.findFirst({ where: { id, userId } })),
    },
    'wishlist-item': {
      joinModel: 'wishlistItemNotification',
      fk: 'wishlistItemId',
      extras: [],
      owned: (id, userId) =>
        this.exists(this.prisma.wishlistItem.findFirst({ where: { id, board: { userId } } })),
    },
    'planned-purchase': {
      joinModel: 'plannedPurchaseNotification',
      fk: 'plannedPurchaseId',
      extras: ['daysBefore'],
      owned: (id, userId) =>
        this.exists(this.prisma.plannedPurchase.findFirst({ where: { id, board: { userId } } })),
    },
    'savings-goal': {
      joinModel: 'savingsGoalNotification',
      fk: 'savingsGoalId',
      extras: [],
      owned: (id, userId) =>
        this.exists(this.prisma.savingsGoal.findFirst({ where: { id, board: { userId } } })),
    },
  };

  private async exists(query: Promise<unknown>): Promise<boolean> {
    return (await query) !== null;
  }

  private config(type: AttachEntityType): EntityConfig {
    const cfg = this.registry[type];
    if (!cfg) throw new BadRequestException(`Unsupported entity type: ${type}`);
    return cfg;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private delegate(joinModel: string): any {
    return (this.prisma as unknown as Record<string, unknown>)[joinModel];
  }

  private async assertEntityOwned(type: AttachEntityType, entityId: string, userId: string): Promise<EntityConfig> {
    const cfg = this.config(type);
    if (!(await cfg.owned(entityId, userId))) {
      throw new NotFoundException('Target not found');
    }
    return cfg;
  }

  /** Notifications attached to a given entity (with their config). */
  async list(type: AttachEntityType, entityId: string, userId: string): Promise<unknown[]> {
    const cfg = await this.assertEntityOwned(type, entityId, userId);
    return this.delegate(cfg.joinModel).findMany({
      where: { [cfg.fk]: entityId },
      include: { notification: true },
    });
  }

  async attach(
    type: AttachEntityType,
    entityId: string,
    notificationId: string,
    userId: string,
    options: AttachOptions = {},
  ): Promise<unknown> {
    const cfg = await this.assertEntityOwned(type, entityId, userId);

    const notif = await this.prisma.notificationConfig.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });
    if (!notif) throw new NotFoundException('Notification not found');

    const existing = await this.delegate(cfg.joinModel).findFirst({
      where: { [cfg.fk]: entityId, notificationId },
      select: { id: true },
    });
    if (existing) throw new ForbiddenException('This notification is already attached');

    const data: Record<string, unknown> = { [cfg.fk]: entityId, notificationId };
    for (const extra of cfg.extras) {
      if (options[extra] !== undefined) data[extra] = options[extra];
    }
    return this.delegate(cfg.joinModel).create({ data, include: { notification: true } });
  }

  async detach(type: AttachEntityType, entityId: string, notificationId: string, userId: string): Promise<{ detached: boolean }> {
    const cfg = await this.assertEntityOwned(type, entityId, userId);
    const result = await this.delegate(cfg.joinModel).deleteMany({
      where: { [cfg.fk]: entityId, notificationId },
    });
    return { detached: result.count > 0 };
  }
}
