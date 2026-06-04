// Entity shape is generated from the Prisma schema (D-011) and re-exported so
// existing imports from this module keep working.
export type { Note } from '@omnidesk/shared';

export interface CreateNoteDto {
  title: string;
  content?: string;
  description?: string;
  icon?: string;
  coverImageUrl?: string;
  isPinned?: boolean;
  tags?: string[];
}

export type UpdateNoteDto = Partial<CreateNoteDto>;
