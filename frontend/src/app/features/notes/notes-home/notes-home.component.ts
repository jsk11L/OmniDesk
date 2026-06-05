import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { NotesService } from '../services/notes.service';
import { NoteEditorComponent } from '../note-editor/note-editor.component';
import type { Note } from '../notes.types';

@Component({
  selector: 'app-notes-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NoteEditorComponent],
  template: `
    <div class="h-full flex">
      <aside class="w-[320px] shrink-0 border-r border-border flex flex-col bg-background">
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-xl font-semibold">Notes</h1>
            <button
              type="button"
              (click)="createNote()"
              class="px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:opacity-90"
              title="New note (Ctrl+N)"
            >
              + New
            </button>
          </div>
          <input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="reload()"
            placeholder="Search…"
            class="w-full px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
          />
        </div>

        <ul class="flex-1 overflow-y-auto p-2 space-y-1">
          @if (loading()) {
            <p class="text-text-muted text-sm p-2">Loading…</p>
          } @else if (notes().length === 0) {
            <p class="text-text-muted text-sm p-2 text-center">
              @if (search) {
                No results for "{{ search }}"
              } @else {
                Create your first note
              }
            </p>
          } @else {
            @for (note of sortedNotes(); track note.id) {
              <li>
                <button
                  type="button"
                  (click)="select(note)"
                  [class]="
                    'w-full text-left px-3 py-2 rounded text-sm transition-colors ' +
                    (selectedId() === note.id
                      ? 'bg-surface-hover border-l-2 border-primary'
                      : 'hover:bg-surface-hover border-l-2 border-transparent')
                  "
                >
                  <div class="flex items-center gap-1.5">
                    @if (note.isPinned) {
                      <span class="text-accent text-xs">★</span>
                    }
                    @if (note.icon) {
                      <span>{{ note.icon }}</span>
                    }
                    <span class="font-medium truncate">{{ note.title || 'Untitled' }}</span>
                  </div>
                  @if (note.tags.length) {
                    <div class="flex flex-wrap gap-1 mt-1">
                      @for (t of note.tags; track t) {
                        <span class="text-xs px-1.5 py-0.5 bg-surface rounded text-text-muted">
                          {{ t }}
                        </span>
                      }
                    </div>
                  }
                  <p class="text-xs text-text-muted mt-1">{{ formatDate(note.updatedAt) }}</p>
                </button>
              </li>
            }
          }
        </ul>
      </aside>

      <section class="flex-1 overflow-hidden">
        @if (selectedNote(); as note) {
          <app-note-editor
            [note]="note"
            (noteDeleted)="onDeleted($event)"
            (noteUpdated)="onUpdated($event)"
          />
        } @else {
          <div class="h-full flex items-center justify-center text-text-muted">
            <div class="text-center">
              <p class="text-lg mb-2">📝</p>
              <p>Select a note or create a new one</p>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class NotesHomeComponent implements OnInit {
  private readonly service = inject(NotesService);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);

  /** Note id to auto-select once the list loads (deep-link from dashboard, ?note=). */
  private pendingSelectId: string | null = null;

  protected readonly loading = signal(true);
  protected readonly notes = signal<Note[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected search = '';

  protected readonly sortedNotes = computed(() => {
    return this.notes()
      .slice()
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  });

  protected readonly selectedNote = computed(() => {
    const id = this.selectedId();
    return id ? this.notes().find((n) => n.id === id) ?? null : null;
  });

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.createNote();
    }
  }

  ngOnInit(): void {
    this.pendingSelectId = this.route.snapshot.queryParamMap.get('note');
    this.reload();
  }

  protected select(note: Note): void {
    this.selectedId.set(note.id);
  }

  protected reload(): void {
    this.loading.set(true);
    this.service.list({ q: this.search || undefined }).subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.loading.set(false);
        // Honor a deep-link (?note=<id>) once, after the list is available.
        if (this.pendingSelectId) {
          const target = notes.find((n) => n.id === this.pendingSelectId);
          if (target) this.selectedId.set(target.id);
          this.pendingSelectId = null;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected createNote(): void {
    this.service.create({ title: 'New note' }).subscribe({
      next: (note) => {
        this.notes.update((arr) => [note, ...arr]);
        this.selectedId.set(note.id);
        this.toastr.success('Note created');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected onDeleted(id: string): void {
    this.notes.update((arr) => arr.filter((n) => n.id !== id));
    if (this.selectedId() === id) this.selectedId.set(null);
  }

  protected onUpdated(updated: Note): void {
    this.notes.update((arr) => arr.map((n) => (n.id === updated.id ? updated : n)));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
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
