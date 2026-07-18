import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface DashboardEventWidget {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  location: string | null;
  allDay: boolean;
}

export interface DashboardTodoWidget {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  column: { id: string; name: string; boardId: string };
}

export interface DashboardNoteWidget {
  id: string;
  title: string;
  icon: string | null;
  coverImageUrl: string | null;
  updatedAt: Date;
  tags: string[];
}

export interface DashboardHabitWidget {
  id: string;
  name: string;
  icon: string | null;
  streak: number;
  doneToday: boolean;
}

export interface DashboardSavingsPotWidget {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  saved: number;
  goal: number;
  percent: number;
}

export interface DashboardStats {
  balance: number;
  balanceDelta: number | null;
  currency: string;
  todoToday: number;
  todoHigh: number;
  eventsThisWeek: number;
  nextEventLabel: string | null;
  bestStreak: number;
  bestStreakHabit: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingEvents: DashboardEventWidget[];
  monthEvents: { day: number; color: string }[];
  todosInProgress: DashboardTodoWidget[];
  savingsPots: DashboardSavingsPotWidget[];
  habitsToday: DashboardHabitWidget[];
  recentNotes: DashboardNoteWidget[];
  randomItem: unknown | null;
}

/** One widget's visibility in the user's dashboard layout. */
export interface DashboardWidgetPref {
  id: string;
  visible: boolean;
}

/** Ordered widget layout for the dashboard (null in DB → frontend defaults). */
export interface DashboardConfig {
  widgets: DashboardWidgetPref[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string): Promise<DashboardData> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const weekEnd = new Date(startOfDay.getTime() + 7 * 86_400_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      upcomingEvents,
      monthEventsRaw,
      eventsThisWeek,
      recentNotes,
      todoItems,
      habitsList,
      todayEntries,
      bestStreakHabit,
      randomItem,
      finance,
    ] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: { userId, startDate: { gte: startOfDay } },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          color: true,
          location: true,
          allDay: true,
        },
      }),
      this.prisma.calendarEvent.findMany({
        where: { userId, startDate: { gte: monthStart, lte: monthEnd } },
        select: { startDate: true, color: true },
      }),
      this.prisma.calendarEvent.count({
        where: { userId, startDate: { gte: startOfDay, lte: weekEnd } },
      }),
      this.prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          title: true,
          icon: true,
          coverImageUrl: true,
          updatedAt: true,
          tags: true,
        },
      }),
      this.prisma.todoItem.findMany({
        where: {
          column: { board: { userId }, isCompletionColumn: false },
          OR: [{ dueDate: { gte: startOfDay, lte: endOfDay } }, { dueDate: null }],
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 6,
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          column: { select: { id: true, name: true, boardId: true } },
        },
      }),
      this.prisma.habit.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 5,
        select: { id: true, name: true, icon: true, currentStreak: true },
      }),
      this.prisma.habitEntry.findMany({
        where: { habit: { userId }, date: { gte: startOfDay, lt: endOfDay } },
        select: { habitId: true, status: true },
      }),
      this.prisma.habit.findFirst({
        where: { userId },
        orderBy: { currentStreak: 'desc' },
        select: { name: true, currentStreak: true },
      }),
      this.pickRandomItem(userId),
      this.getFinanceSnapshot(userId, monthStart, monthEnd),
    ]);

    const doneSet = new Set(
      todayEntries.filter((e) => e.status === 'DONE').map((e) => e.habitId),
    );
    const habitsToday: DashboardHabitWidget[] = habitsList.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      streak: h.currentStreak,
      doneToday: doneSet.has(h.id),
    }));

    const savingsPots = await this.getSavingsPots(userId);

    const todoHigh = todoItems.filter(
      (t) => t.priority === 'HIGH' || t.priority === 'URGENT',
    ).length;

    const next = upcomingEvents[0];
    const nextEventLabel = next
      ? `${next.title} · ${this.shortWhen(next.startDate)}`
      : null;

    const monthEvents = monthEventsRaw.map((e) => ({
      day: e.startDate.getDate(),
      color: e.color,
    }));

    return {
      stats: {
        balance: finance.balance,
        balanceDelta: finance.delta,
        currency: finance.currency,
        todoToday: todoItems.length,
        todoHigh,
        eventsThisWeek,
        nextEventLabel,
        bestStreak: bestStreakHabit?.currentStreak ?? 0,
        bestStreakHabit: bestStreakHabit?.currentStreak ? bestStreakHabit.name : null,
      },
      upcomingEvents,
      monthEvents,
      todosInProgress: todoItems,
      savingsPots,
      habitsToday,
      recentNotes,
      randomItem,
    };
  }

  private shortWhen(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private async getSavingsPots(userId: string): Promise<DashboardSavingsPotWidget[]> {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { board: { userId }, isCompleted: false },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        currentAmount: true,
        targetAmount: true,
      },
    });
    return goals
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        color: g.color,
        saved: g.currentAmount,
        goal: g.targetAmount,
        percent:
          g.targetAmount > 0
            ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
            : 0,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }

  private async getFinanceSnapshot(
    userId: string,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<{ balance: number; delta: number | null; currency: string }> {
    const board = await this.prisma.financeBoard.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, currency: true },
    });
    if (!board) return { balance: 0, delta: null, currency: 'USD' };

    const prevStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const prevEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0, 23, 59, 59);

    const sum = async (type: 'INCOME' | 'EXPENSE', gte: Date, lte: Date) => {
      const r = await this.prisma.transaction.aggregate({
        where: { boardId: board.id, type, date: { gte, lte } },
        _sum: { amount: true },
      });
      return r._sum.amount ?? 0;
    };

    const [incThis, expThis, incPrev, expPrev] = await Promise.all([
      sum('INCOME', monthStart, monthEnd),
      sum('EXPENSE', monthStart, monthEnd),
      sum('INCOME', prevStart, prevEnd),
      sum('EXPENSE', prevStart, prevEnd),
    ]);

    const balance = round2(incThis - expThis);
    const prevBalance = incPrev - expPrev;
    const hadPrev = incPrev !== 0 || expPrev !== 0;
    return {
      balance,
      delta: hadPrev ? round2(balance - prevBalance) : null,
      currency: board.currency,
    };
  }

  private async pickRandomItem(userId: string): Promise<unknown | null> {
    // Only lists that actually have at least one item (single query).
    const lists = await this.prisma.list.findMany({
      where: { userId, items: { some: {} } },
      select: {
        id: true,
        name: true,
        icon: true,
        fields: { where: { fieldType: 'IMAGE_URL' }, select: { id: true }, take: 1 },
      },
    });
    if (lists.length === 0) return null;

    const list = lists[Math.floor(Math.random() * lists.length)];
    const itemsCount = await this.prisma.listItem.count({ where: { listId: list.id } });
    if (itemsCount === 0) return null;

    const itemIdx = Math.floor(Math.random() * itemsCount);
    const item = await this.prisma.listItem.findFirst({
      where: { listId: list.id },
      skip: itemIdx,
      take: 1,
      select: { id: true, title: true, customFields: true },
    });
    if (!item) return null;

    const imageFieldId = list.fields[0]?.id;
    const customFields = item.customFields as Record<string, unknown>;
    const imageUrl =
      imageFieldId && typeof customFields[imageFieldId] === 'string'
        ? (customFields[imageFieldId] as string)
        : null;

    return {
      list: { id: list.id, name: list.name, icon: list.icon },
      item: { id: item.id, title: item.title, imageUrl, customFields },
    };
  }

  /** The user's saved dashboard layout, or null when they've never customized it. */
  async getConfig(userId: string): Promise<DashboardConfig | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dashboardConfig: true },
    });
    const raw = user?.dashboardConfig;
    return this.isConfig(raw) ? raw : null;
  }

  /** Persist the widget layout, sanitizing to `{ id, visible }[]`. */
  async saveConfig(userId: string, config: DashboardConfig): Promise<DashboardConfig> {
    const widgets: DashboardWidgetPref[] = (config?.widgets ?? [])
      .filter((w): w is DashboardWidgetPref => !!w && typeof w.id === 'string')
      .map((w) => ({ id: w.id, visible: w.visible !== false }));
    const next: DashboardConfig = { widgets };
    await this.prisma.user.update({
      where: { id: userId },
      data: { dashboardConfig: next as unknown as Prisma.InputJsonValue },
    });
    return next;
  }

  private isConfig(raw: unknown): raw is DashboardConfig {
    return (
      !!raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as DashboardConfig).widgets)
    );
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
