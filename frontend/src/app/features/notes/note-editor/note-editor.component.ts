import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  ViewChild,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { NotesService } from '../services/notes.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { EmojiPickerComponent } from '../../../shared/components/emoji-picker/emoji-picker.component';
import {
  NoteSettingsDialogComponent,
  type NoteSettingsDialogData,
  type NoteSettingsDialogResult,
} from '../note-settings-dialog/note-settings-dialog.component';
import type { Note, UpdateNoteDto } from '../notes.types';

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EmojiPickerComponent],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <div class="flex items-center justify-between mb-3 text-xs text-text-muted">
          <span>
            @switch (status()) {
              @case ('saving') { Saving… }
              @case ('saved') { ✓ Saved }
              @case ('dirty') { Unsaved changes }
              @case ('error') { ✗ Save error }
            }
          </span>
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="togglePin()"
              [title]="pinned() ? 'Unpin' : 'Pin'"
              class="hover:text-text"
            >
              {{ pinned() ? '★' : '☆' }}
            </button>
            <button
              type="button"
              (click)="deleteSelected()"
              class="hover:text-danger"
              title="Delete note"
            >
              🗑
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-2">
          <app-emoji-picker
            [initialValue]="icon"
            placeholder="📝"
            (valueChange)="onIconChange($event)"
          />
          <input
            type="text"
            [(ngModel)]="title"
            (ngModelChange)="onMetaChange()"
            maxlength="200"
            placeholder="Untitled"
            class="flex-1 text-2xl font-semibold bg-transparent outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            (click)="openSettings()"
            class="px-2 py-1 rounded hover:bg-surface-hover text-sm"
            title="Note settings"
          >⚙</button>
        </div>

        <input
          type="text"
          [(ngModel)]="description"
          (ngModelChange)="onMetaChange()"
          maxlength="280"
          placeholder="Short description…"
          class="w-full px-2 py-1 text-sm bg-transparent text-text-muted outline-none focus:text-text mb-1"
        />

        <div class="flex items-center gap-2 mt-2 flex-wrap">
          @for (tag of tags(); track tag; let i = $index) {
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-hover rounded-full text-xs"
            >
              {{ tag }}
              <button
                type="button"
                (click)="removeTag(i)"
                class="opacity-60 hover:opacity-100"
                aria-label="Remove tag"
              >
                ×
              </button>
            </span>
          }
          <input
            type="text"
            [(ngModel)]="newTag"
            (keydown.enter)="addTag()"
            placeholder="+ Tag"
            class="text-xs bg-transparent outline-none border-b border-border focus:border-primary px-1 w-20"
          />
        </div>
      </header>

      <div class="border-b border-border px-6 py-2 flex items-center gap-1 flex-wrap">
        <button type="button" (click)="cmd('toggleBold')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" (click)="cmd('toggleItalic')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm italic" title="Italic">
          I
        </button>
        <button type="button" (click)="cmd('toggleStrike')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm line-through" title="Strikethrough">
          S
        </button>
        <span class="w-px h-5 bg-border mx-1"></span>
        <button type="button" (click)="setHeading(1)" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Heading 1">H1</button>
        <button type="button" (click)="setHeading(2)" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Heading 2">H2</button>
        <button type="button" (click)="setHeading(3)" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Heading 3">H3</button>
        <span class="w-px h-5 bg-border mx-1"></span>
        <button type="button" (click)="cmd('toggleBulletList')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm w-8" title="Bullet list">•</button>
        <button type="button" (click)="cmd('toggleOrderedList')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm w-8" title="Numbered list">1.</button>
        <button type="button" (click)="cmd('toggleBlockquote')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Quote">"</button>
        <button type="button" (click)="cmd('toggleCodeBlock')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm font-mono" title="Code">{{ '<>' }}</button>
        <span class="w-px h-5 bg-border mx-1"></span>
        <button type="button" (click)="insertLink()" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Link">🔗</button>
        <button type="button" (click)="insertImage()" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Image">🖼</button>
        <button type="button" (click)="cmd('setHorizontalRule')" class="px-2 py-1 rounded hover:bg-surface-hover text-sm" title="Divider">―</button>
      </div>

      <div
        #editorEl
        class="flex-1 overflow-auto px-6 py-4 prose prose-invert max-w-none focus:outline-none cursor-text"
        style="min-height: 240px;"
        (click)="focusEditor()"
      ></div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .ProseMirror {
        outline: none;
        min-height: 240px;
        color: var(--color-text);
        cursor: text;
      }
      :host ::ng-deep .ProseMirror p.is-editor-empty:first-child::before {
        content: 'Start writing…';
        color: var(--color-text-muted);
        float: left;
        height: 0;
        pointer-events: none;
      }
      :host ::ng-deep .ProseMirror h1 {
        font-size: 1.875rem;
        font-weight: 600;
        margin: 1rem 0 0.5rem;
      }
      :host ::ng-deep .ProseMirror h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.875rem 0 0.5rem;
      }
      :host ::ng-deep .ProseMirror h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem;
      }
      :host ::ng-deep .ProseMirror p {
        margin: 0.5rem 0;
        line-height: 1.6;
      }
      :host ::ng-deep .ProseMirror ul,
      :host ::ng-deep .ProseMirror ol {
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }
      /* Tailwind preflight resets list-style to none; restore the markers. */
      :host ::ng-deep .ProseMirror ul {
        list-style: disc outside;
      }
      :host ::ng-deep .ProseMirror ol {
        list-style: decimal outside;
      }
      :host ::ng-deep .ProseMirror li {
        margin: 0.125rem 0;
      }
      :host ::ng-deep .ProseMirror li p {
        margin: 0;
      }
      :host ::ng-deep .ProseMirror blockquote {
        border-left: 3px solid var(--color-border);
        padding-left: 1rem;
        margin: 0.5rem 0;
        color: var(--color-text-muted);
      }
      :host ::ng-deep .ProseMirror code {
        background: var(--color-surface);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.875rem;
      }
      :host ::ng-deep .ProseMirror pre {
        background: var(--color-surface);
        padding: 0.75rem;
        border-radius: 0.375rem;
        overflow-x: auto;
      }
      :host ::ng-deep .ProseMirror a {
        color: var(--color-primary);
        text-decoration: underline;
      }
      :host ::ng-deep .ProseMirror img {
        max-width: 100%;
        border-radius: 0.375rem;
      }
      :host ::ng-deep .ProseMirror hr {
        border: 0;
        border-top: 1px solid var(--color-border);
        margin: 1rem 0;
      }
    `,
  ],
})
export class NoteEditorComponent implements AfterViewInit, OnDestroy {
  private readonly service = inject(NotesService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(DialogService);

  readonly note = input.required<Note>();
  readonly noteDeleted = output<string>();
  readonly noteUpdated = output<Note>();

  @ViewChild('editorEl', { static: true }) editorEl!: ElementRef<HTMLDivElement>;

  protected readonly status = signal<SaveStatus>('saved');
  protected readonly pinned = signal(false);
  protected readonly tags = signal<string[]>([]);
  protected title = '';
  protected icon: string | null = '';
  protected coverImageUrl = '';
  protected description = '';
  protected newTag = '';

  private editor: Editor | null = null;
  private currentNoteId: string | null = null;
  private readonly save$ = new Subject<{ id: string; payload: UpdateNoteDto }>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Sync the selected note into the editor + local state whenever the input
    // changes. allowSignalWrites is REQUIRED (Angular <=18): writing signals in
    // an effect throws NG0600 by default, which would abort the effect before
    // applyNoteToEditor() runs and leave the editor showing the previous note.
    effect(
      () => {
        const n = this.note();
        // Reset the editor content FIRST so a stale signal write can never
        // strand the editor on the previous note's content.
        this.applyNoteToEditor(n);
        this.title = n.title;
        this.icon = n.icon ?? '';
        this.coverImageUrl = n.coverImageUrl ?? '';
        this.description = n.description ?? '';
        this.pinned.set(n.isPinned);
        this.tags.set([...n.tags]);
        this.status.set('saved');
      },
      { allowSignalWrites: true },
    );

    // The note id is captured at enqueue time (not at flush time) so a debounced
    // autosave from note A can never be written onto note B after switching.
    this.save$.pipe(debounceTime(2000), takeUntil(this.destroy$)).subscribe(({ id, payload }) => {
      this.flush(payload, id);
    });
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit,
        Image.configure({ inline: false }),
        Link.configure({ openOnClick: false, autolink: true }),
      ],
      content: '<p></p>',
      onUpdate: ({ editor }) => {
        this.status.set('dirty');
        const json = editor.getJSON();
        this.save$.next({ id: this.note().id, payload: { content: JSON.stringify(json) } });
      },
    });
    this.applyNoteToEditor(this.note());
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected focusEditor(): void {
    this.editor?.commands.focus();
  }

  private applyNoteToEditor(note: Note): void {
    if (!this.editor) return;
    if (this.currentNoteId === note.id) return;
    this.currentNoteId = note.id;
    const content = this.parseContent(note.content);
    this.editor.commands.setContent(content as never, false);
  }

  private parseContent(raw: string): unknown {
    if (!raw || raw.trim() === '') return '<p></p>';
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'type' in parsed) return parsed;
      return '<p></p>';
    } catch {
      return raw.startsWith('<') ? raw : `<p>${raw}</p>`;
    }
  }

  protected cmd(name: string): void {
    if (!this.editor) return;
    const chain = (this.editor.chain().focus() as unknown as Record<string, () => { run(): boolean }>);
    if (typeof chain[name] === 'function') {
      chain[name]().run();
    }
  }

  protected setHeading(level: 1 | 2 | 3): void {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  protected async insertLink(): Promise<void> {
    const url = await this.dialogs.prompt({
      title: 'Insert link',
      label: 'Link URL',
      inputType: 'url',
      placeholder: 'https://…',
      confirmLabel: 'Insert',
    });
    if (!url) return;
    this.editor?.chain().focus().setLink({ href: url }).run();
  }

  protected async insertImage(): Promise<void> {
    const url = await this.dialogs.prompt({
      title: 'Insert image',
      label: 'Image URL',
      inputType: 'url',
      placeholder: 'https://…',
      confirmLabel: 'Insert',
    });
    if (!url) return;
    this.editor?.chain().focus().setImage({ src: url }).run();
  }

  protected onMetaChange(): void {
    this.status.set('dirty');
    this.save$.next({
      id: this.note().id,
      payload: {
        title: this.title.trim() || 'Untitled',
        icon: this.icon?.trim() || undefined,
        description: this.description.trim() || undefined,
        coverImageUrl: this.coverImageUrl.trim() || undefined,
      },
    });
  }

  protected onIconChange(value: string | null): void {
    this.icon = value;
    this.status.set('dirty');
    this.save$.next({ id: this.note().id, payload: { icon: value ?? undefined } });
  }

  protected openSettings(): void {
    const ref = this.dialog.open<
      NoteSettingsDialogComponent,
      NoteSettingsDialogData,
      NoteSettingsDialogResult
    >(NoteSettingsDialogComponent, { data: { note: this.note() } });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.coverImageUrl = updated.coverImageUrl ?? '';
        this.tags.set([...updated.tags]);
        this.pinned.set(updated.isPinned);
        this.noteUpdated.emit(updated);
      }
    });
  }

  protected togglePin(): void {
    const next = !this.pinned();
    this.pinned.set(next);
    this.status.set('saving');
    this.flush({ isPinned: next });
  }

  protected addTag(): void {
    const v = this.newTag.trim();
    if (!v) return;
    if (this.tags().includes(v)) {
      this.newTag = '';
      return;
    }
    const next = [...this.tags(), v];
    this.tags.set(next);
    this.newTag = '';
    this.status.set('saving');
    this.flush({ tags: next });
  }

  protected removeTag(index: number): void {
    const next = this.tags().filter((_, i) => i !== index);
    this.tags.set(next);
    this.status.set('saving');
    this.flush({ tags: next });
  }

  protected async deleteSelected(): Promise<void> {
    const n = this.note();
    const ok = await this.dialogs.confirm({
      title: 'Delete note',
      message: `Delete the note "${n.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete(n.id).subscribe({
      next: () => {
        this.toastr.success('Note deleted');
        this.noteDeleted.emit(n.id);
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  private flush(payload: UpdateNoteDto, id: string = this.note().id): void {
    this.status.set('saving');
    this.service.update(id, payload).subscribe({
      next: (updated) => {
        this.status.set('saved');
        this.noteUpdated.emit(updated);
      },
      error: () => this.status.set('error'),
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
