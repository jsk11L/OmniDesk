export type ListViewType = 'GRID' | 'TABLE' | 'GALLERY' | 'LIST';
export type SortDirection = 'ASC' | 'DESC';
export type ListFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'URL'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RATING'
  | 'IMAGE_URL';

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

export interface ListTag {
  id: string;
  listId: string;
  name: string;
  color: string;
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
  imageUrl: string | null;
  customFields: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
  tags?: ListItemTagLink[];
}

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
};

export interface CreateListItemDto {
  title: string;
  imageUrl?: string;
  customFields?: Record<string, unknown>;
  tagIds?: string[];
}

export type UpdateListItemDto = Partial<CreateListItemDto> & { position?: number };

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
