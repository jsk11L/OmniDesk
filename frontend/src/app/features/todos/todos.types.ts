// Entity shapes come from the Prisma-generated source (D-011). Relation fields
// the API nests (column.items, board.columns) are composed here.
import type {
  TodoColumn as TodoColumnBase,
  TodoBoard as TodoBoardBase,
  TodoItem,
  TodoPriority,
} from '@omnidesk/shared';

export type { TodoItem, TodoPriority };

export interface TodoColumn extends TodoColumnBase {
  items: TodoItem[];
}

export interface TodoBoard extends TodoBoardBase {
  columns?: TodoColumn[];
}

export interface CreateBoardDto {
  name: string;
}

export interface CreateColumnDto {
  name: string;
  color?: string;
  position?: number;
  isCompletionColumn?: boolean;
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
