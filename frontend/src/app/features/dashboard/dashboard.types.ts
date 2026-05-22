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

export interface DashboardTodosBucket {
  completed: DashboardTodoWidget[];
  pending: DashboardTodoWidget[];
  extraNoDate: DashboardTodoWidget | null;
}

export interface DashboardFinanceGoalWidget {
  type: 'budget' | 'savings';
  id: string;
  name: string;
  current: number;
  target: number;
  percent: number;
}

export interface DashboardRandomItemWidget {
  list: { id: string; name: string; icon: string | null };
  item: { id: string; title: string; imageUrl: string | null; customFields: Record<string, unknown> };
}

export interface DashboardData {
  nextEvent: DashboardEventWidget | null;
  todayTodos: DashboardTodosBucket;
  latestNote: DashboardNoteWidget | null;
  nextFinanceGoal: DashboardFinanceGoalWidget | null;
  randomItem: DashboardRandomItemWidget | null;
}
