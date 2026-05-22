import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface DashboardData {
  nextEvent: unknown | null;
  todayTodos: {
    completed: unknown[];
    pending: unknown[];
    extraNoDate: unknown | null;
  };
  latestNote: unknown | null;
  nextFinanceGoal: unknown | null;
  randomItem: unknown | null;
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

    const [nextEvent, latestNote, todoItems, completedColumnNames, randomItem] = await Promise.all([
      this.prisma.calendarEvent.findFirst({
        where: { userId, startDate: { gt: now } },
        orderBy: { startDate: 'asc' },
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
      this.prisma.note.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
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
          column: { board: { userId } },
          OR: [
            { dueDate: { gte: startOfDay, lte: endOfDay } },
            { dueDate: null },
          ],
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          column: { select: { id: true, name: true, boardId: true } },
        },
        take: 50,
      }),
      this.detectCompletedColumnNames(),
      this.pickRandomItem(userId),
    ]);

    const completed: typeof todoItems = [];
    const pending: typeof todoItems = [];
    const noDate: typeof todoItems = [];
    for (const item of todoItems) {
      const isCompleted = completedColumnNames.has(item.column.name.toLowerCase());
      if (!item.dueDate) {
        if (!isCompleted) noDate.push(item);
      } else if (isCompleted) {
        completed.push(item);
      } else {
        pending.push(item);
      }
    }
    const extraNoDate =
      noDate.length > 0 ? noDate[Math.floor(Math.random() * noDate.length)] : null;

    const nextFinanceGoal = await this.getNextFinanceGoal(userId);

    return {
      nextEvent,
      todayTodos: { completed, pending, extraNoDate },
      latestNote,
      nextFinanceGoal,
      randomItem,
    };
  }

  private detectCompletedColumnNames(): Promise<Set<string>> {
    return Promise.resolve(new Set(['hecho', 'done', 'completado', 'completadas', 'completed', 'finalizado']));
  }

  private async pickRandomItem(userId: string): Promise<unknown | null> {
    const listsCount = await this.prisma.list.count({ where: { userId } });
    if (listsCount === 0) return null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const listIdx = Math.floor(Math.random() * listsCount);
      const list = await this.prisma.list.findFirst({
        where: { userId },
        skip: listIdx,
        take: 1,
        select: {
          id: true,
          name: true,
          icon: true,
          fields: { where: { fieldType: 'IMAGE_URL' }, select: { id: true }, take: 1 },
        },
      });
      if (!list) continue;

      const itemsCount = await this.prisma.listItem.count({ where: { listId: list.id } });
      if (itemsCount === 0) continue;

      const itemIdx = Math.floor(Math.random() * itemsCount);
      const item = await this.prisma.listItem.findFirst({
        where: { listId: list.id },
        skip: itemIdx,
        take: 1,
        select: { id: true, title: true, customFields: true },
      });
      if (!item) continue;

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
    return null;
  }

  private async getNextFinanceGoal(userId: string): Promise<unknown | null> {
    const board = await this.prisma.financeBoard.findFirst({
      where: { userId, isDefault: true },
      select: { id: true },
    });
    if (!board) return null;

    const budgets = await this.prisma.budget.findMany({
      where: { boardId: board.id },
      select: { id: true, name: true, amount: true, categoryId: true, period: true },
    });
    if (budgets.length === 0) return null;

    const ranked = await Promise.all(
      budgets.map(async (b) => {
        const since = this.periodStart(b.period);
        const spent = await this.prisma.transaction.aggregate({
          where: {
            boardId: board.id,
            type: 'EXPENSE',
            date: { gte: since },
            ...(b.categoryId ? { categoryId: b.categoryId } : {}),
          },
          _sum: { amount: true },
        });
        const current = spent._sum.amount ?? 0;
        return {
          type: 'budget' as const,
          id: b.id,
          name: b.name,
          current,
          target: b.amount,
          percent: b.amount > 0 ? Math.min(100, Math.round((current / b.amount) * 100)) : 0,
        };
      }),
    );
    ranked.sort((a, b) => b.percent - a.percent);
    return ranked[0] ?? null;
  }

  private periodStart(period: 'WEEKLY' | 'MONTHLY' | 'ANNUAL'): Date {
    const now = new Date();
    if (period === 'WEEKLY') {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (period === 'ANNUAL') {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
