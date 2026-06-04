// Enums and the relation-free ListTag come from the Prisma-generated source
// (D-011). List, ListField and ListItem stay local: they expose the JSON
// columns (gridConfig, viewConfig, options, customFields) as frontend-specific
// shapes rather than the generated `unknown`.
import type { ListViewType, SortDirection, ListFieldType, ListTag } from '@omnidesk/shared';

export type { ListViewType, SortDirection, ListFieldType, ListTag };

export interface ListField {
  id: string;
  listId: string;
  name: string;
  fieldType: ListFieldType;
  isRequired: boolean;
  position: number;
  options: Record<string, unknown> | null;
  defaultValue: string | null;
}

export interface ListItemTagLink {
  itemId: string;
  tagId: string;
  tag?: ListTag;
}

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  customFields: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
  tags?: ListItemTagLink[];
}

export type GridTemplate =
  | 'card-large'
  | 'card-compact'
  | 'card-cover'
  | 'dense-list'
  | 'gallery-no-image'
  | 'table';

export interface GridConfig {
  template: GridTemplate;
  visibleFields: string[];
  showImage: boolean;
  imagePosition: 'top' | 'left';
  showTags: boolean;
}

export type FilterType =
  | 'text-contains'
  | 'number-range'
  | 'date-range'
  | 'tag-in'
  | 'boolean-equals'
  | 'select-in';

export interface ListFilter {
  fieldId: string;
  type: FilterType;
  value: unknown;
}

export interface ViewConfig {
  groupBy: string | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters: ListFilter[];
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  template: 'card-large',
  visibleFields: [],
  showImage: true,
  imagePosition: 'top',
  showTags: true,
};

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  groupBy: null,
  sortBy: 'createdAt',
  sortDir: 'desc',
  filters: [],
};

export interface List {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string | null;
  coverImageUrl: string | null;
  defaultView: ListViewType;
  defaultSortField: string | null;
  defaultSortDir: SortDirection;
  gridConfig: Partial<GridConfig>;
  viewConfig: Partial<ViewConfig>;
  createdAt: string;
  updatedAt: string;
  fields?: ListField[];
  tags?: ListTag[];
  items?: ListItem[];
}

export interface CreateListDto {
  name: string;
  description?: string;
  icon?: string;
  coverImageUrl?: string;
  defaultView?: ListViewType;
}

export type UpdateListDto = Partial<CreateListDto> & {
  defaultSortField?: string;
  defaultSortDir?: SortDirection;
  gridConfig?: Partial<GridConfig>;
  viewConfig?: Partial<ViewConfig>;
};

export interface CreateListItemDto {
  title: string;
  customFields?: Record<string, unknown>;
  tagIds?: string[];
}

export type UpdateListItemDto = Partial<CreateListItemDto> & { position?: number };

export interface MoveListItemDto {
  targetListId: string;
  title?: string;
  customFieldsPatch?: Record<string, unknown>;
}

export interface CreateListFieldDto {
  name: string;
  fieldType: ListFieldType;
  isRequired?: boolean;
  position?: number;
  options?: Record<string, unknown>;
  defaultValue?: string;
}

export type UpdateListFieldDto = Partial<CreateListFieldDto>;

export interface CreateListTagDto {
  name: string;
  color?: string;
}

export function resolveGridConfig(list: List): GridConfig {
  return { ...DEFAULT_GRID_CONFIG, ...(list.gridConfig ?? {}) };
}

export function resolveViewConfig(list: List): ViewConfig {
  return { ...DEFAULT_VIEW_CONFIG, ...(list.viewConfig ?? {}) };
}

export function findImageField(list: List): ListField | null {
  return list.fields?.find((f) => f.fieldType === 'IMAGE_URL') ?? null;
}
