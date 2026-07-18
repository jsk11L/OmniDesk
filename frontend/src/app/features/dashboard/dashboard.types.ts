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

// ─── Customizable layout ───────────────────────────────────────────────
export type DashboardWidgetKind = 'stat' | 'panel';

export interface DashboardWidgetMeta {
  id: string;
  label: string;
  kind: DashboardWidgetKind;
}

/** The full catalog of dashboard widgets, in their default order. */
export const DASHBOARD_WIDGETS: DashboardWidgetMeta[] = [
  { id: 'balance', label: 'Balance', kind: 'stat' },
  { id: 'todoToday', label: 'Tasks today', kind: 'stat' },
  { id: 'eventsWeek', label: 'Events this week', kind: 'stat' },
  { id: 'bestStreak', label: 'Best streak', kind: 'stat' },
  { id: 'upcomingEvents', label: 'Upcoming events', kind: 'panel' },
  { id: 'tasksInProgress', label: 'On your plate (tasks)', kind: 'panel' },
  { id: 'savingsPots', label: 'Savings pots', kind: 'panel' },
  { id: 'miniCalendar', label: 'Mini calendar', kind: 'panel' },
  { id: 'habitsToday', label: 'Habits today', kind: 'panel' },
  { id: 'recentNotes', label: 'Recent notes', kind: 'panel' },
];

export interface DashboardWidgetPref {
  id: string;
  visible: boolean;
}

export interface DashboardConfig {
  widgets: DashboardWidgetPref[];
}

/**
 * Merge a stored config with the widget catalog: keep known widgets in their
 * stored order + visibility, drop unknown ids, and append any new catalog
 * widgets (visible) at the end. Always returns the full widget set.
 */
export function resolveDashboardWidgets(stored: DashboardConfig | null | undefined): DashboardWidgetPref[] {
  const known = new Map(DASHBOARD_WIDGETS.map((w) => [w.id, w]));
  const seen = new Set<string>();
  const result: DashboardWidgetPref[] = [];
  for (const w of stored?.widgets ?? []) {
    if (known.has(w.id) && !seen.has(w.id)) {
      result.push({ id: w.id, visible: w.visible !== false });
      seen.add(w.id);
    }
  }
  for (const w of DASHBOARD_WIDGETS) {
    if (!seen.has(w.id)) result.push({ id: w.id, visible: true });
  }
  return result;
}
