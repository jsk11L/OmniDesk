// Entity shape is generated from the Prisma schema (D-011) and re-exported so
// existing imports from this module keep working.
export type { Note } from '@omnidesk/shared';
import type { Note } from '@omnidesk/shared';

/** What a note can be anchored to. */
export type NoteAnchorType = 'event' | 'list-item';

export interface CreateNoteDto {
  title: string;
  content?: string;
  description?: string;
  icon?: string;
  coverImageUrl?: string;
  isPinned?: boolean;
  tags?: string[];
  anchorType?: NoteAnchorType;
  anchorId?: string;
}

export type UpdateNoteDto = Partial<Omit<CreateNoteDto, 'anchorType' | 'anchorId'>>;

/** An anchored note plus the live label of the element it's tied to. */
export type AnchoredNote = Note & { anchorLabel: string | null };
