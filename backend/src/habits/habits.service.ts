import { Injectable, NotFoundException } from '@nestjs/common';
import type { Habit, HabitEntry } from '@prisma/client';
import { HabitEntryStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { MarkHabitEntryDto } from './dto/mark-habit-entry.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<Habit[]> {
    return this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(userId: string, id: string): Promise<Habit> {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    return this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        color: dto.color ?? '#6366f1',
        activeDays: dto.activeDays,
        weeklyGoal: dto.weeklyGoal ?? null,
        goalPeriod: dto.goalPeriod ?? null,
        goalTarget: dto.goalTarget ?? null,
        dailyMin: dto.dailyMin ?? null,
        dailyMax: dto.dailyMax ?? null,
        isFeatured: dto.isFeatured ?? false,
      },
    });
  }

  /** How many check-ins count the day as done: min, else max, else 1. */
  private dailyTarget(habit: { dailyMin: number | null; dailyMax: number | null }): number {
    return habit.dailyMin ?? habit.dailyMax ?? 1;
  }

  /** A day is "complete" when recovered, or done with the count target met. */
  private isComplete(
    habit: { dailyMin: number | null; dailyMax: number | null },
    entry: { status: HabitEntryStatus; count: number },
  ): boolean {
    if (entry.status === HabitEntryStatus.RECOVERED) return true;
    if (entry.status !== HabitEntryStatus.DONE) return false;
    return entry.count >= this.dailyTarget(habit);
  }

  async update(userId: string, id: string, dto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.findById(userId, id);
    // Only one habit is featured at a time.
    if (dto.isFeatured === true) {
      await this.prisma.habit.updateMany({
        where: { userId, id: { not: id } },
        data: { isFeatured: false },
      });
    }
    return this.prisma.habit.update({
      where: { id },
      data: {
        name: dto.name ?? habit.name,
        description: dto.description ?? habit.description,
        icon: dto.icon ?? habit.icon,
        color: dto.color ?? habit.color,
        activeDays: dto.activeDays ?? habit.activeDays,
        weeklyGoal: dto.weeklyGoal === undefined ? habit.weeklyGoal : dto.weeklyGoal || null,
        goalPeriod: dto.goalPeriod === undefined ? habit.goalPeriod : dto.goalPeriod || null,
        goalTarget: dto.goalTarget === undefined ? habit.goalTarget : dto.goalTarget || null,
        dailyMin: dto.dailyMin === undefined ? habit.dailyMin : dto.dailyMin || null,
        dailyMax: dto.dailyMax === undefined ? habit.dailyMax : dto.dailyMax || null,
        isFeatured: dto.isFeatured === undefined ? habit.isFeatured : dto.isFeatured,
      },
    });
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    await this.findById(userId, id);
    await this.prisma.habit.delete({ where: { id } });
    return { id };
  }

  async entries(userId: string, habitId: string, from?: string, to?: string): Promise<HabitEntry[]> {
    await this.findById(userId, habitId);
    const where: Record<string, unknown> = { habitId };
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range['gte'] = new Date(from);
      if (to) range['lte'] = new Date(to);
      where['date'] = range;
    }
    return this.prisma.habitEntry.findMany({
      where: where as never,
      orderBy: { date: 'asc' },
    });
  }

  /** Today's entry status for every habit of the user, in a single query (avoids N+1). */
  async today(
    userId: string,
  ): Promise<{ habitId: string; status: HabitEntryStatus; count: number }[]> {
    const start = new Date(new Date().toISOString().slice(0, 10));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return this.prisma.habitEntry.findMany({
      where: { habit: { userId }, date: { gte: start, lt: end } },
      select: { habitId: true, status: true, count: true },
    });
  }

  async markEntry(userId: string, habitId: string, dto: MarkHabitEntryDto): Promise<HabitEntry> {
    await this.findById(userId, habitId);
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);

    const count = dto.count ?? 1;
    const entry = await this.prisma.habitEntry.upsert({
      where: { habitId_date: { habitId, date } },
      create: {
        habitId,
        date,
        status: dto.status,
        count,
        notes: dto.notes ?? null,
      },
      update: {
        status: dto.status,
        count,
        notes: dto.notes ?? null,
      },
    });

    await this.recomputeStats(habitId);
    return entry;
  }

  /**
   * Current-week (Monday→Sunday) status per habit, for the week-row UI.
   * One query for every habit's entries in the window. `status` is the raw
   * entry status; the client derives REST/active days from `activeDays`.
   */
  async week(userId: string): Promise<
    Array<{
      habitId: string;
      days: Array<{ date: string; status: HabitEntryStatus | null; count: number }>;
    }>
  > {
    const monday = new Date();
    monday.setUTCHours(0, 0, 0, 0);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const end = new Date(monday);
    end.setUTCDate(end.getUTCDate() + 7);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const [habits, entries] = await Promise.all([
      this.prisma.habit.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      }),
      this.prisma.habitEntry.findMany({
        where: { habit: { userId }, date: { gte: monday, lt: end } },
        select: { habitId: true, date: true, status: true, count: true },
      }),
    ]);

    const byHabit = new Map<string, Map<string, { status: HabitEntryStatus; count: number }>>();
    for (const e of entries) {
      const day = new Date(e.date).toISOString().slice(0, 10);
      const m = byHabit.get(e.habitId) ?? new Map<string, { status: HabitEntryStatus; count: number }>();
      m.set(day, { status: e.status, count: e.count });
      byHabit.set(e.habitId, m);
    }

    return habits.map((h) => ({
      habitId: h.id,
      days: dates.map((date) => {
        const e = byHabit.get(h.id)?.get(date);
        return { date, status: e?.status ?? null, count: e?.count ?? 0 };
      }),
    }));
  }

  async deleteEntry(userId: string, habitId: string, dateStr: string): Promise<{ date: string }> {
    await this.findById(userId, habitId);
    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);
    await this.prisma.habitEntry.deleteMany({ where: { habitId, date } });
    await this.recomputeStats(habitId);
    return { date: date.toISOString() };
  }

  async stats(userId: string, habitId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    perfectWeeks: number;
    monthCompletionPct: number;
    target: number;
    heatmap: Array<{ date: string; status: HabitEntryStatus | null; count: number }>;
  }> {
    const habit = await this.findById(userId, habitId);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);
    const entries = await this.prisma.habitEntry.findMany({
      where: { habitId, date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const heatmap: Array<{ date: string; status: HabitEntryStatus | null; count: number }> = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dow = d.getUTCDay();
      const isActiveDay = habit.activeDays.includes(dow);
      const entry = entries.find(
        (e) => new Date(e.date).toISOString().slice(0, 10) === d.toISOString().slice(0, 10),
      );
      let status: HabitEntryStatus | null = entry?.status ?? null;
      if (!isActiveDay && !status) status = HabitEntryStatus.REST;
      heatmap.push({ date: d.toISOString().slice(0, 10), status, count: entry?.count ?? 0 });
    }

    const monthStart = new Date(today);
    monthStart.setUTCDate(1);
    let activeDaysInMonth = 0;
    let doneInMonth = 0;
    for (const c of heatmap) {
      const cd = new Date(c.date);
      if (cd < monthStart) continue;
      const dow = cd.getUTCDay();
      if (!habit.activeDays.includes(dow)) continue;
      activeDaysInMonth++;
      if (c.status && this.isComplete(habit, { status: c.status, count: c.count })) doneInMonth++;
    }
    const monthCompletionPct =
      activeDaysInMonth > 0 ? Math.round((doneInMonth / activeDaysInMonth) * 100) : 0;

    return {
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      perfectWeeks: habit.perfectWeeks,
      monthCompletionPct,
      target: this.dailyTarget(habit),
      heatmap,
    };
  }

  private async recomputeStats(habitId: string): Promise<void> {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return;
    const entries = await this.prisma.habitEntry.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let currentStreak = 0;
    let cursor = new Date(today);
    while (true) {
      const dow = cursor.getUTCDay();
      if (!habit.activeDays.includes(dow)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        if (cursor < new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)) break;
        continue;
      }
      const entry = entries.find(
        (e) => new Date(e.date).toISOString().slice(0, 10) === cursor.toISOString().slice(0, 10),
      );
      if (entry && this.isComplete(habit, entry)) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }

    let longestStreak = Math.max(habit.longestStreak, currentStreak);

    const perfectWeeks = this.countPerfectWeeks(habit, entries, today);

    await this.prisma.habit.update({
      where: { id: habitId },
      data: { currentStreak, longestStreak, perfectWeeks },
    });
  }

  /**
   * A "perfect week" is one where every active day of that week has a DONE or
   * RECOVERED entry. Only fully-elapsed weeks count: if any active day of the
   * week is still in the future, the week is not counted yet (avoids marking an
   * in-progress week as perfect prematurely). Weeks are Sunday-aligned to match
   * `Date.getUTCDay()` (0 = Sunday).
   */
  private countPerfectWeeks(
    habit: { activeDays: number[]; dailyMin: number | null; dailyMax: number | null },
    entries: { date: Date | string; status: HabitEntryStatus; count: number }[],
    today: Date,
  ): number {
    const activeDays = habit.activeDays;
    if (entries.length === 0 || activeDays.length === 0) return 0;

    const completed = new Set(
      entries
        .filter((e) => this.isComplete(habit, e))
        .map((e) => new Date(e.date).toISOString().slice(0, 10)),
    );

    // entries are ordered date desc, so the last element is the earliest.
    const earliest = new Date(entries[entries.length - 1].date);
    earliest.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(earliest);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

    let perfectWeeks = 0;
    for (const ws = new Date(weekStart); ws <= today; ws.setUTCDate(ws.getUTCDate() + 7)) {
      let allDone = true;
      for (const dow of activeDays) {
        const day = new Date(ws);
        day.setUTCDate(day.getUTCDate() + dow);
        if (day > today) {
          allDone = false; // week not fully elapsed yet
          break;
        }
        if (!completed.has(day.toISOString().slice(0, 10))) {
          allDone = false;
          break;
        }
      }
      if (allDone) perfectWeeks++;
    }
    return perfectWeeks;
  }
}
