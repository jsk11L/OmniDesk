// Entity shapes from the Prisma-generated source (D-011).
export type { Habit, HabitEntry, HabitEntryStatus, GoalPeriod } from '@omnidesk/shared';

import type { HabitEntryStatus, GoalPeriod } from '@omnidesk/shared';

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  perfectWeeks: number;
  monthCompletionPct: number;
  heatmap: Array<{ date: string; status: HabitEntryStatus | null }>;
}

export interface HabitWeek {
  habitId: string;
  days: Array<{ date: string; status: HabitEntryStatus | null }>;
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  activeDays: number[];
  weeklyGoal?: number;
  goalPeriod?: GoalPeriod;
  goalTarget?: number;
}

export type UpdateHabitDto = Partial<CreateHabitDto>;

export interface MarkHabitEntryDto {
  date: string;
  status: HabitEntryStatus;
  notes?: string;
}
