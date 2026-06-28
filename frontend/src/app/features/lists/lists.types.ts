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

/**
 * Where a field is rendered on the Large card:
 * - `body`  → default flow, right under the title (legacy behaviour)
 * - `stack` → stacked ABOVE the title, auto-scaled (Obsidian-style header)
 * - `tl…br` → absolutely anchored to one of the 9 zones (3×3 matrix). `br`
 *   gives the classic "index in the bottom-right corner" look.
 */
export type CardSlot =
  | 'body'
  | 'stack'
  | 'tl'
  | 'tc'
  | 'tr'
  | 'ml'
  | 'mc'
  | 'mr'
  | 'bl'
  | 'bc'
  | 'br';

/** How a DATE value is shown on a card (e.g. "May" when you group by year). */
export type DateDisplayFormat = 'full' | 'month' | 'month-year' | 'year';

/** Named typographic levels a field can be styled as on a card. */
export type StyleLevel = 'title' | 'subtitle' | 'body' | 'caption';

export interface LevelStyle {
  /** CSS font-family stack (one of CARD_FONTS values). */
  font: string;
  /** Font size in px. */
  size: number;
  weight: 400 | 500 | 600 | 700;
  /** '' = inherit the theme text color; otherwise a hex/CSS color. */
  color: string;
  transform: 'none' | 'uppercase';
  /** Text shadow for legibility over images. */
  shadow: boolean;
}

export interface CardStyle {
  levels: Record<StyleLevel, LevelStyle>;
  /** '' = default surface; otherwise a card background color. */
  background: string;
  /** '' = default border; otherwise a border color. */
  border: string;
  /** 0–100 dark overlay over the card image (legibility for light images). */
  imageScrim: number;
}

/** Curated font set offered in the card style editor. */
export const CARD_FONTS: { label: string; value: string }[] = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Manrope', value: "'Manrope', sans-serif" },
  { label: 'Newsreader', value: "'Newsreader', serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
];

export interface FieldCardLayout {
  slot: CardSlot;
  /** Show the "Field name:" prefix. Off → just the raw value. */
  showLabel: boolean;
  dateFormat?: DateDisplayFormat;
  /** Typographic level; defaults by slot (stack→subtitle, anchor→caption, body→body). */
  level?: StyleLevel;
}

export interface GridConfig {
  template: GridTemplate;
  visibleFields: string[];
  showImage: boolean;
  imagePosition: 'top' | 'left';
  showTags: boolean;
  /** Per-field card layout (Large card only). Keyed by field id. */
  cardLayout?: Record<string, FieldCardLayout>;
  /** Typographic levels + card chrome (Large/Cover cards). */
  cardStyle?: CardStyle;
}

export const DEFAULT_CARD_STYLE: CardStyle = {
  levels: {
    title: { font: "'Inter', sans-serif", size: 18, weight: 600, color: '', transform: 'none', shadow: false },
    subtitle: { font: "'Inter', sans-serif", size: 14, weight: 500, color: '', transform: 'none', shadow: false },
    body: { font: "'Inter', sans-serif", size: 12, weight: 400, color: '', transform: 'none', shadow: false },
    caption: { font: "'JetBrains Mono', monospace", size: 11, weight: 400, color: '', transform: 'uppercase', shadow: false },
  },
  background: '',
  border: '',
  imageScrim: 0,
};

/** The 3×3 anchor matrix, row-major, for the layout picker UI. */
export const CARD_MATRIX_SLOTS: CardSlot[] = [
  'tl', 'tc', 'tr',
  'ml', 'mc', 'mr',
  'bl', 'bc', 'br',
];

export const DEFAULT_FIELD_LAYOUT: FieldCardLayout = { slot: 'body', showLabel: true };

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

/** A one-click button on an item card that sets a SELECT field to a fixed value. */
export interface ListAction {
  id: string;
  label: string;
  fieldId: string;
  value: string;
  color?: string;
}

export interface ViewConfig {
  groupBy: string | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters: ListFilter[];
  actions?: ListAction[];
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

export interface ImportListReport {
  listId: string;
  listName: string;
  itemsCreated: number;
  fieldsCreated: number;
  tagsCreated: number;
  assetsUploaded: number;
  skipped: string[];
  errors: string[];
}

export interface DetectedField {
  key: string;
  suggestedName: string;
  suggestedType: ListFieldType;
  noteCount: number;
  totalValues: number;
  numericCount: number;
  dateCount: number;
  arrayCount: number;
  sampleValues: string[];
}

export interface ImportAnalysis {
  noteCount: number;
  tagCount: number;
  fields: DetectedField[];
}

export interface FieldOverride {
  key: string;
  name?: string;
  type?: ListFieldType;
  include?: boolean;
}

export interface ObsidianImportConfig {
  name?: string;
  listId?: string;
  fields: FieldOverride[];
}

/** Inline CSS for a typographic level (shared by the card render + style editor). */
export function levelToCss(s: LevelStyle): { [k: string]: string } {
  const css: { [k: string]: string } = {
    'font-family': s.font,
    'font-size': `${s.size}px`,
    'font-weight': String(s.weight),
    'text-transform': s.transform,
  };
  if (s.color) css['color'] = s.color;
  if (s.shadow) css['text-shadow'] = '0 1px 3px rgba(0, 0, 0, 0.7)';
  return css;
}

export function resolveGridConfig(list: List): GridConfig {
  return { ...DEFAULT_GRID_CONFIG, ...(list.gridConfig ?? {}) };
}

/** Card style merged with defaults (handles older lists without `cardStyle`). */
export function resolveCardStyle(config: GridConfig): CardStyle {
  const cs = config.cardStyle;
  if (!cs) return DEFAULT_CARD_STYLE;
  return {
    levels: {
      title: { ...DEFAULT_CARD_STYLE.levels.title, ...cs.levels?.title },
      subtitle: { ...DEFAULT_CARD_STYLE.levels.subtitle, ...cs.levels?.subtitle },
      body: { ...DEFAULT_CARD_STYLE.levels.body, ...cs.levels?.body },
      caption: { ...DEFAULT_CARD_STYLE.levels.caption, ...cs.levels?.caption },
    },
    background: cs.background ?? '',
    border: cs.border ?? '',
    // Range inputs persist as strings — coerce so `@if (imageScrim)` and math work.
    imageScrim: Number(cs.imageScrim ?? 0) || 0,
  };
}

export function resolveViewConfig(list: List): ViewConfig {
  return { ...DEFAULT_VIEW_CONFIG, ...(list.viewConfig ?? {}) };
}

export function findImageField(list: List): ListField | null {
  return list.fields?.find((f) => f.fieldType === 'IMAGE_URL') ?? null;
}
