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
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.findById(userId, id);
    return this.prisma.habit.update({
      where: { id },
      data: {
        name: dto.name ?? habit.name,
        description: dto.description ?? habit.description,
        icon: dto.icon ?? habit.icon,
        color: dto.color ?? habit.color,
        activeDays: dto.activeDays ?? habit.activeDays,
        weeklyGoal: dto.weeklyGoal === undefined ? habit.weeklyGoal : dto.weeklyGoal || null,
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

  async markEntry(userId: string, habitId: string, dto: MarkHabitEntryDto): Promise<HabitEntry> {
    await this.findById(userId, habitId);
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);

    const entry = await this.prisma.habitEntry.upsert({
      where: { habitId_date: { habitId, date } },
      create: {
        habitId,
        date,
        status: dto.status,
        notes: dto.notes ?? null,
      },
      update: {
        status: dto.status,
        notes: dto.notes ?? null,
      },
    });

    await this.recomputeStats(habitId);
    return entry;
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
    heatmap: Array<{ date: string; status: HabitEntryStatus | null }>;
  }> {
    const habit = await this.findById(userId, habitId);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);
    const entries = await this.prisma.habitEntry.findMany({
      where: { habitId, date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const heatmap: Array<{ date: string; status: HabitEntryStatus | null }> = [];
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
      heatmap.push({ date: d.toISOString().slice(0, 10), status });
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
      if (c.status === HabitEntryStatus.DONE || c.status === HabitEntryStatus.RECOVERED) doneInMonth++;
    }
    const monthCompletionPct =
      activeDaysInMonth > 0 ? Math.round((doneInMonth / activeDaysInMonth) * 100) : 0;

    return {
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      perfectWeeks: habit.perfectWeeks,
      monthCompletionPct,
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
      if (entry?.status === HabitEntryStatus.DONE || entry?.status === HabitEntryStatus.RECOVERED) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }

    let longestStreak = Math.max(habit.longestStreak, currentStreak);

    await this.prisma.habit.update({
      where: { id: habitId },
      data: { currentStreak, longestStreak },
    });
  }
}
