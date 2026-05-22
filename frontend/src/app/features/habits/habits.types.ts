export type HabitEntryStatus = 'DONE' | 'MISSED' | 'RECOVERED' | 'REST';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  activeDays: number[];
  weeklyGoal: number | null;
  currentStreak: number;
  longestStreak: number;
  perfectWeeks: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  status: HabitEntryStatus;
  notes: string | null;
  createdAt: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  perfectWeeks: number;
  monthCompletionPct: number;
  heatmap: Array<{ date: string; status: HabitEntryStatus | null }>;
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  activeDays: number[];
  weeklyGoal?: number;
}

export type UpdateHabitDto = Partial<CreateHabitDto>;

export interface MarkHabitEntryDto {
  date: string;
  status: HabitEntryStatus;
  notes?: string;
}
