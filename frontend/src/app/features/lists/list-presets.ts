import {
  DEFAULT_CARD_STYLE,
  type CardSlot,
  type CardStyle,
  type DateDisplayFormat,
  type GridTemplate,
  type ListFieldType,
  type StyleLevel,
} from './lists.types';

/** A field a preset scaffolds, plus how it sits on the card. */
export interface PresetField {
  name: string;
  type: ListFieldType;
  options?: string[];
  /** Show on the card (added to visibleFields). Image fields are usually false. */
  onCard?: boolean;
  slot?: CardSlot;
  level?: StyleLevel;
  showLabel?: boolean;
  dateFormat?: DateDisplayFormat;
}

/** A ready-made list scaffold: suggested fields + card layout + style. */
export interface ListPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  listIcon?: string;
  template: GridTemplate;
  showImage: boolean;
  showTags: boolean;
  cardStyle?: CardStyle;
  fields: PresetField[];
}

/** A card style identical to the default but with a custom Title font. */
function titleFont(font: string): CardStyle {
  const s = structuredClone(DEFAULT_CARD_STYLE);
  s.levels.title.font = font;
  return s;
}

export const LIST_PRESETS: ListPreset[] = [
  {
    id: 'blank',
    name: 'Blank',
    icon: '⬜',
    description: 'Start from scratch — add your own fields.',
    template: 'card-large',
    showImage: true,
    showTags: true,
    fields: [],
  },
  {
    id: 'movies',
    name: 'Movies',
    icon: '🎬',
    listIcon: '🎬',
    description: 'Letterboxd-style posters with rating, director and year.',
    template: 'poster',
    showImage: true,
    showTags: true,
    cardStyle: titleFont("'Playfair Display', serif"),
    fields: [
      { name: 'Poster', type: 'IMAGE_URL' },
      { name: 'Rating', type: 'RATING', onCard: true, level: 'subtitle', showLabel: false },
      { name: 'Director', type: 'TEXT', onCard: true, level: 'caption', showLabel: false },
      { name: 'Year', type: 'NUMBER', onCard: true, level: 'caption', showLabel: false },
      {
        name: 'Genre',
        type: 'MULTI_SELECT',
        options: ['Drama', 'Comedy', 'Action', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Documentary', 'Animation'],
      },
      { name: 'Watched', type: 'DATE' },
    ],
  },
  {
    id: 'albums',
    name: 'Music albums',
    icon: '💿',
    listIcon: '💿',
    description: 'Square covers with artist and year.',
    template: 'square',
    showImage: true,
    showTags: true,
    fields: [
      { name: 'Cover', type: 'IMAGE_URL' },
      { name: 'Artist', type: 'TEXT', onCard: true, level: 'subtitle', showLabel: false },
      { name: 'Year', type: 'NUMBER', onCard: true, level: 'caption', showLabel: false },
      { name: 'Rating', type: 'RATING' },
      { name: 'Label', type: 'TEXT' },
    ],
  },
  {
    id: 'books',
    name: 'Books',
    icon: '📚',
    listIcon: '📚',
    description: 'Book covers with author and rating.',
    template: 'poster',
    showImage: true,
    showTags: true,
    cardStyle: titleFont("'Newsreader', serif"),
    fields: [
      { name: 'Cover', type: 'IMAGE_URL' },
      { name: 'Rating', type: 'RATING', onCard: true, level: 'subtitle', showLabel: false },
      { name: 'Author', type: 'TEXT', onCard: true, level: 'caption', showLabel: false },
      { name: 'Year', type: 'NUMBER' },
      { name: 'Read', type: 'DATE' },
      {
        name: 'Genre',
        type: 'MULTI_SELECT',
        options: ['Fiction', 'Non-fiction', 'Fantasy', 'Sci-Fi', 'Biography', 'History', 'Self-help', 'Poetry'],
      },
    ],
  },
  {
    id: 'series',
    name: 'TV series',
    icon: '📺',
    listIcon: '📺',
    description: 'Posters with watch status and rating.',
    template: 'poster',
    showImage: true,
    showTags: true,
    fields: [
      { name: 'Poster', type: 'IMAGE_URL' },
      {
        name: 'Status',
        type: 'SELECT',
        options: ['Watching', 'Completed', 'On hold', 'Dropped', 'Plan to watch'],
        onCard: true,
        level: 'subtitle',
        showLabel: false,
      },
      { name: 'Seasons', type: 'NUMBER', onCard: true, level: 'caption', showLabel: true },
      { name: 'Rating', type: 'RATING' },
    ],
  },
  {
    id: 'games',
    name: 'Games',
    icon: '🎮',
    listIcon: '🎮',
    description: 'Obsidian-style: cover, platform stacked over the title, index in the corner.',
    template: 'card-large',
    showImage: true,
    showTags: true,
    fields: [
      { name: 'Cover', type: 'IMAGE_URL' },
      {
        name: 'Platform',
        type: 'SELECT',
        options: ['PC', 'PS5', 'PS4', 'Switch', 'Xbox', 'Mobile'],
        onCard: true,
        slot: 'stack',
        level: 'subtitle',
        showLabel: false,
      },
      { name: 'Month', type: 'TEXT', onCard: true, slot: 'stack', level: 'caption', showLabel: false },
      { name: 'Index', type: 'NUMBER', onCard: true, slot: 'br', level: 'caption', showLabel: false },
      { name: 'Status', type: 'SELECT', options: ['Backlog', 'Playing', 'Completed', 'Dropped'] },
    ],
  },
];
