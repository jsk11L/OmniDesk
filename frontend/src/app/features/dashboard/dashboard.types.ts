export interface DashboardEventWidget {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  location: string | null;
  allDay: boolean;
}

export interface DashboardNoteWidget {
  id: string;
  title: string;
  icon: string | null;
  coverImageUrl: string | null;
  updatedAt: string;
  tags: string[];
}

export interface DashboardTodoWidget {
  id: string;
  title: string;
  dueDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  column: { id: string; name: string; boardId: string };
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

export interface DashboardRandomItemWidget {
  list: { id: string; name: string; icon: string | null };
  item: { id: string; title: string; imageUrl: string | null; customFields: Record<string, unknown> };
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingEvents: DashboardEventWidget[];
  monthEvents: { day: number; color: string }[];
  todosInProgress: DashboardTodoWidget[];
  savingsPots: DashboardSavingsPotWidget[];
  habitsToday: DashboardHabitWidget[];
  recentNotes: DashboardNoteWidget[];
  randomItem: DashboardRandomItemWidget | null;
}
