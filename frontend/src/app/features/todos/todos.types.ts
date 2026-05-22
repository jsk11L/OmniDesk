export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TodoItem {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  hasDueDate: boolean;
  priority: TodoPriority;
  hasPriority: boolean;
  tags: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoColumn {
  id: string;
  boardId: string;
  name: string;
  color: string;
  position: number;
  items: TodoItem[];
}

export interface TodoBoard {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  columns?: TodoColumn[];
}

export interface CreateBoardDto {
  name: string;
}

export interface CreateColumnDto {
  name: string;
  color?: string;
  position?: number;
}

export type UpdateColumnDto = Partial<CreateColumnDto>;

export interface CreateItemDto {
  title: string;
  description?: string;
  dueDate?: string;
  hasDueDate?: boolean;
  priority?: TodoPriority;
  hasPriority?: boolean;
  tags?: string[];
  position?: number;
}

export type UpdateItemDto = Partial<CreateItemDto> & { columnId?: string };

export interface ReorderItemEntry {
  id: string;
  columnId: string;
  position: number;
}
