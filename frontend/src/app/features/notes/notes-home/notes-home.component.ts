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
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';

import { NotesService } from '../services/notes.service';
import { NoteEditorComponent } from '../note-editor/note-editor.component';
import {
  AnchoredNoteDialogComponent,
  type AnchoredNoteDialogData,
  type AnchoredNoteDialogResult,
} from '../anchored-note-dialog/anchored-note-dialog.component';
import type { AnchoredNote, Note, NoteAnchorType, NoteSummary } from '../notes.types';

@Component({
  selector: 'app-notes-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgTemplateOutlet, RouterLink, NoteEditorComponent],
  template: `
    <div class="h-full flex">
      <aside
        [class]="
          'shrink-0 border-r border-border flex-col bg-background w-full md:w-[320px] ' +
          (selectedId() ? 'hidden md:flex' : 'flex')
        "
      >
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="uppercase-tag">Notes</div>
              <div class="text-sm font-semibold mt-0.5">{{ notes().length }} note{{ notes().length === 1 ? '' : 's' }}</div>
            </div>
            <div class="flex items-center gap-2">
              <a
                routerLink="/app/notes/import"
                class="px-2 py-1.5 rounded text-xs text-text-muted hover:bg-surface-hover hover:text-text"
                title="Import from Obsidian"
              >
                Import
              </a>
              <button
                type="button"
                (click)="createNote()"
                class="px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:opacity-90"
                title="New note (Ctrl+N)"
              >
                + New
              </button>
            </div>
          </div>
          <input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="onSearchInput()"
            placeholder="Search note or tag…"
            class="w-full px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
          />
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          @if (anchoredNotes().length) {
            <button type="button" (click)="toggleAnchored()"
              class="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-hover mb-1">
              <span class="uppercase-tag">📌 Anchored · {{ anchoredNotes().length }}</span>
              <span class="text-text-faint text-xs">{{ anchoredOpen() ? '▾' : '▸' }}</span>
            </button>
            @if (anchoredOpen()) {
              <div class="space-y-1 mb-3">
                @for (note of anchoredNotes(); track note.id) {
                  <button type="button" (click)="openAnchored(note)"
                    class="w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover border-l-2 border-transparent">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs">{{ note.anchorType === 'event' ? '📅' : '🗂️' }}</span>
                      <span class="font-medium truncate">{{ note.title || 'Untitled' }}</span>
                    </div>
                    <p class="text-xs text-text-muted mt-0.5 truncate">
                      {{ note.anchorLabel ?? '(element deleted)' }}
                    </p>
                  </button>
                }
              </div>
            }
          }
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
            @if (pinnedNotes().length) {
              <div class="uppercase-tag px-2 pt-1 pb-1">Pinned</div>
              <div class="space-y-1 mb-2">
                @for (note of pinnedNotes(); track note.id) {
                  <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: note }" />
                }
              </div>
            }

            <div class="uppercase-tag px-2 pt-2 pb-1 flex items-center justify-between">
              <span>All</span>
              @if (totalPages() > 1) {
                <span class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="prevPage()"
                    [disabled]="page() === 0"
                    class="w-6 h-6 grid place-items-center rounded hover:bg-surface-hover disabled:opacity-30 text-text-muted"
                    aria-label="Previous page"
                  >‹</button>
                  <span class="mono text-[10px] text-text-faint">{{ page() + 1 }}/{{ totalPages() }}</span>
                  <button
                    type="button"
                    (click)="nextPage()"
                    [disabled]="page() >= totalPages() - 1"
                    class="w-6 h-6 grid place-items-center rounded hover:bg-surface-hover disabled:opacity-30 text-text-muted"
                    aria-label="Next page"
                  >›</button>
                </span>
              }
            </div>
            @if (pagedNotes().length === 0) {
              <p class="text-text-muted text-xs p-2 text-center">No more notes.</p>
            } @else {
              <div class="space-y-1">
                @for (note of pagedNotes(); track note.id) {
                  <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: note }" />
                }
              </div>
            }
          }
        </div>
      </aside>

      <ng-template #row let-note>
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
      </ng-template>

      <section
        [class]="
          'flex-1 overflow-hidden flex-col min-w-0 ' +
          (selectedId() ? 'flex' : 'hidden md:flex')
        "
      >
        @if (selectedNote(); as note) {
          <button
            type="button"
            (click)="selectedId.set(null); selectedNote.set(null)"
            class="md:hidden px-4 py-2 text-sm text-text-muted hover:text-text border-b border-border text-left shrink-0"
          >
            ← Notes
          </button>
          <app-note-editor
            class="flex-1 min-h-0 block"
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
  private readonly dialog = inject(MatDialog);

  /** Anchored notes (tied to events / list items), shown in a collapsible section. */
  protected readonly anchoredNotes = signal<AnchoredNote[]>([]);
  protected readonly anchoredOpen = signal(false);

  /** Note id to auto-select once the list loads (deep-link from dashboard, ?note=). */
  private pendingSelectId: string | null = null;

  protected readonly loading = signal(true);
  protected readonly notes = signal<NoteSummary[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  /** Full note (with content) for the editor — fetched on select. */
  protected readonly selectedNote = signal<Note | null>(null);
  protected search = '';

  /** Debounced search — reload() per keystroke was one API call per key. */
  private readonly search$ = new Subject<void>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.reload());
  }

  protected onSearchInput(): void {
    this.search$.next();
  }

  /** How many "All" notes show per horizontal page. */
  private readonly pageSize = 10;
  protected readonly page = signal(0);

  private readonly byRecent = (a: NoteSummary, b: NoteSummary) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  protected readonly pinnedNotes = computed(() =>
    this.notes().filter((n) => n.isPinned).slice().sort(this.byRecent),
  );

  private readonly unpinnedNotes = computed(() =>
    this.notes().filter((n) => !n.isPinned).slice().sort(this.byRecent),
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.unpinnedNotes().length / this.pageSize)),
  );

  protected readonly pagedNotes = computed(() => {
    const start = this.page() * this.pageSize;
    return this.unpinnedNotes().slice(start, start + this.pageSize);
  });

  protected prevPage(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  protected nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }


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
    this.loadAnchored();
  }

  protected select(note: NoteSummary): void {
    this.selectedId.set(note.id);
    // The list only carries metadata — fetch the full body for the editor.
    this.service.findById(note.id).subscribe({
      next: (full) => {
        // Guard against a stale response after switching selection quickly.
        if (this.selectedId() === full.id) this.selectedNote.set(full);
      },
      error: (err: HttpErrorResponse) => {
        this.selectedId.set(null);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected toggleAnchored(): void {
    this.anchoredOpen.update((v) => !v);
  }

  private loadAnchored(): void {
    this.service.listAnchored().subscribe({
      next: (notes) => this.anchoredNotes.set(notes),
      error: () => undefined,
    });
  }

  /** Open an anchored note's popup editor; refresh the list after any change. */
  protected openAnchored(note: AnchoredNote): void {
    if (!note.anchorType || !note.anchorId) return;
    const ref = this.dialog.open<AnchoredNoteDialogComponent, AnchoredNoteDialogData, AnchoredNoteDialogResult>(
      AnchoredNoteDialogComponent,
      {
        data: {
          anchorType: note.anchorType as NoteAnchorType,
          anchorId: note.anchorId,
          anchorLabel: note.anchorLabel ?? note.title,
        },
        width: 'min(560px, 95vw)',
        maxWidth: '95vw',
      },
    );
    ref.afterClosed().subscribe((result) => {
      if (result === 'changed') this.loadAnchored();
    });
  }

  protected reload(): void {
    this.loading.set(true);
    this.page.set(0);
    this.service.list({ q: this.search || undefined }).subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.loading.set(false);
        // Honor a deep-link (?note=<id>) once, after the list is available.
        if (this.pendingSelectId) {
          const target = notes.find((n) => n.id === this.pendingSelectId);
          if (target) this.select(target);
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
        this.selectedNote.set(note); // create returns the full note — no refetch
        this.toastr.success('Note created');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected onDeleted(id: string): void {
    this.notes.update((arr) => arr.filter((n) => n.id !== id));
    if (this.selectedId() === id) {
      this.selectedId.set(null);
      this.selectedNote.set(null);
    }
  }

  protected onUpdated(updated: Note): void {
    this.notes.update((arr) => arr.map((n) => (n.id === updated.id ? updated : n)));
    if (this.selectedId() === updated.id) this.selectedNote.set(updated);
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
