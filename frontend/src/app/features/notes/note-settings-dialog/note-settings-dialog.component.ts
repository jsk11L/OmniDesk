import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { NotesService } from '../services/notes.service';
import { ImageInputComponent } from '../../../shared/components/image-input/image-input.component';
import type { Note } from '../notes.types';

export interface NoteSettingsDialogData {
  note: Note;
}

export type NoteSettingsDialogResult = Note | undefined;

@Component({
  selector: 'app-note-settings-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ImageInputComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(520px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">Configuración de la nota</h2>

      <div class="space-y-4">
        <div>
          <span class="block text-xs text-text-muted mb-1">Imagen de portada</span>
          <app-image-input
            [initialValue]="coverImageUrl()"
            (valueChange)="setCover($event)"
          />
        </div>

        <div>
          <span class="block text-xs text-text-muted mb-1">Tags</span>
          <div class="flex items-center gap-2 flex-wrap">
            @for (tag of tags(); track tag; let i = $index) {
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-hover rounded-full text-xs">
                {{ tag }}
                <button type="button" (click)="removeTag(i)" class="opacity-60 hover:opacity-100">×</button>
              </span>
            }
            <input
              type="text"
              [(ngModel)]="newTag"
              (keydown.enter)="addTag(); $event.preventDefault()"
              placeholder="+ Tag"
              class="text-xs bg-transparent outline-none border-b border-border focus:border-primary px-1 w-24"
            />
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" [(ngModel)]="pinned" class="accent-primary" />
          <span class="text-sm">Fijar nota en la parte superior</span>
        </label>
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">
          Cancelar
        </button>
        <button
          type="button"
          (click)="save()"
          [disabled]="saving()"
          class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
        >
          {{ saving() ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
})
export class NoteSettingsDialogComponent {
  private readonly service = inject(NotesService);
  private readonly toastr = inject(ToastrService);

  protected readonly saving = signal(false);
  protected readonly coverImageUrl = signal<string | null>(null);
  protected readonly tags = signal<string[]>([]);
  protected newTag = '';
  protected pinned = false;

  constructor(
    public ref: MatDialogRef<NoteSettingsDialogComponent, NoteSettingsDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: NoteSettingsDialogData,
  ) {
    this.coverImageUrl.set(data.note.coverImageUrl);
    this.tags.set([...data.note.tags]);
    this.pinned = data.note.isPinned;
  }

  setCover(v: string | null): void {
    this.coverImageUrl.set(v);
  }

  addTag(): void {
    const v = this.newTag.trim();
    if (!v || this.tags().includes(v)) {
      this.newTag = '';
      return;
    }
    this.tags.update((t) => [...t, v]);
    this.newTag = '';
  }

  removeTag(index: number): void {
    this.tags.update((t) => t.filter((_, i) => i !== index));
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const cover = this.coverImageUrl();
    this.service
      .update(this.data.note.id, {
        coverImageUrl: cover ?? undefined,
        tags: this.tags(),
        isPinned: this.pinned,
      })
      .subscribe({
        next: (note) => {
          this.toastr.success('Configuración guardada');
          this.ref.close(note);
        },
        error: () => {
          this.saving.set(false);
          this.toastr.error('No se pudo guardar');
        },
      });
  }
}
