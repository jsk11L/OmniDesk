import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { NotesService } from '../services/notes.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type { NoteAnchorType } from '../notes.types';

export interface AnchoredNoteDialogData {
  anchorType: NoteAnchorType;
  anchorId: string;
  /** Element label — seeds a new note's title and shown as context. */
  anchorLabel: string;
}

/** 'changed' when the anchored note was created/updated/deleted. */
export type AnchoredNoteDialogResult = 'changed' | undefined;

@Component({
  selector: 'app-anchored-note-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(560px,95vw)] max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-3 mb-1">
        <h2 class="text-lg font-semibold">📌 Anchored note</h2>
        @if (noteId()) {
          <button type="button" (click)="remove()" [disabled]="saving()"
            class="text-sm text-danger hover:underline shrink-0">Delete</button>
        }
      </div>
      <p class="text-xs text-text-muted mb-4">
        Tied to {{ data.anchorType === 'event' ? 'event' : 'item' }}:
        <span class="font-medium text-text">{{ data.anchorLabel }}</span>
        · hidden from your main notes list
      </p>

      @if (loading()) {
        <p class="text-text-muted text-sm py-6">Loading…</p>
      } @else {
        <label class="block mb-3">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input type="text" [(ngModel)]="title" maxlength="200"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Note</span>
          <textarea [(ngModel)]="content" rows="8" placeholder="Write your note about this element…"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"></textarea>
        </label>

        <div class="flex justify-end gap-2 pt-4">
          <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">Cancel</button>
          <button type="button" (click)="save()" [disabled]="saving() || !title.trim()"
            class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class AnchoredNoteDialogComponent implements OnInit {
  private readonly notes = inject(NotesService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly noteId = signal<string | null>(null);
  protected title = '';
  protected content = '';

  constructor(
    public ref: MatDialogRef<AnchoredNoteDialogComponent, AnchoredNoteDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: AnchoredNoteDialogData,
  ) {}

  ngOnInit(): void {
    this.notes.findByAnchor(this.data.anchorType, this.data.anchorId).subscribe({
      next: (note) => {
        if (note) {
          this.noteId.set(note.id);
          this.title = note.title;
          this.content = note.content ?? note.plainText ?? '';
        } else {
          this.title = this.data.anchorLabel;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    const title = this.title.trim();
    if (this.saving() || !title) return;
    this.saving.set(true);
    const id = this.noteId();
    const request$ = id
      ? this.notes.update(id, { title, content: this.content })
      : this.notes.create({
          title,
          content: this.content,
          anchorType: this.data.anchorType,
          anchorId: this.data.anchorId,
        });
    request$.subscribe({
      next: () => {
        this.toastr.success('Anchored note saved');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  async remove(): Promise<void> {
    const id = this.noteId();
    if (!id || this.saving()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete anchored note',
      message: 'Delete this note? This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.saving.set(true);
    this.notes.delete(id).subscribe({
      next: () => {
        this.toastr.success('Anchored note deleted');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
