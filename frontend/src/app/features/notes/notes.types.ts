export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  icon: string | null;
  coverImageUrl: string | null;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  icon?: string;
  coverImageUrl?: string;
  isPinned?: boolean;
  tags?: string[];
}

export type UpdateNoteDto = Partial<CreateNoteDto>;
