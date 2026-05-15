import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import type { List, ListField, ListItem, ListTag } from '../lists.types';

export interface ListItemDialogData {
  list: List;
  item?: ListItem;
}

export type ListItemDialogResult = ListItem | undefined;

@Component({
  selector: 'app-list-item-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, TagChipComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(600px,95vw)] max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">
        {{ data.item ? 'Editar ítem' : 'Nuevo ítem' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Título *</span>
          <input
            type="text"
            formControlName="title"
            maxlength="200"
            autofocus
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">URL de imagen</span>
          <input
            type="url"
            formControlName="imageUrl"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            placeholder="https://…"
          />
          @if (imagePreview()) {
            <img
              [src]="imagePreview()"
              alt=""
              class="mt-2 w-full max-h-40 object-contain rounded border border-border"
            />
          }
        </label>

        @if (fields.length > 0) {
          <div class="border-t border-border pt-4">
            <p class="text-xs font-medium text-text-muted mb-3">Campos personalizados</p>
            <div class="space-y-3">
              @for (field of fields; track field.id) {
                <div>
                  <span class="block text-xs text-text-muted mb-1">
                    {{ field.name }}
                    @if (field.isRequired) {
                      <span class="text-danger">*</span>
                    }
                  </span>
                  @switch (field.fieldType) {
                    @case ('TEXT') {
                      <input
                        type="text"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                      />
                    }
                    @case ('NUMBER') {
                      <input
                        type="number"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                      />
                    }
                    @case ('URL') {
                      <input
                        type="url"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                        placeholder="https://…"
                      />
                    }
                    @case ('IMAGE_URL') {
                      <input
                        type="url"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                        placeholder="https://…"
                      />
                    }
                    @case ('DATE') {
                      <input
                        type="date"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                      />
                    }
                    @case ('BOOLEAN') {
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [formControl]="customControl(field.id)"
                          class="accent-primary"
                        />
                        <span class="text-sm">Sí</span>
                      </label>
                    }
                    @case ('RATING') {
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                        placeholder="0-10"
                      />
                    }
                    @case ('SELECT') {
                      <select
                        [formControl]="customControl(field.id)"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                      >
                        <option value="">—</option>
                        @for (opt of fieldOptions(field); track opt) {
                          <option [value]="opt">{{ opt }}</option>
                        }
                      </select>
                    }
                    @case ('MULTI_SELECT') {
                      <input
                        type="text"
                        [formControl]="customControl(field.id)"
                        placeholder="Valores separados por coma"
                        class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                      />
                    }
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (data.list.tags && data.list.tags.length > 0) {
          <div class="border-t border-border pt-4">
            <p class="text-xs font-medium text-text-muted mb-2">Tags</p>
            <div class="flex flex-wrap gap-2">
              @for (tag of data.list.tags; track tag.id) {
                <button
                  type="button"
                  (click)="toggleTag(tag.id)"
                  [class]="
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-opacity ' +
                    (selectedTags().has(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70')
                  "
                  [style.background-color]="tag.color + '33'"
                  [style.color]="tag.color"
                >
                  {{ tag.name }}
                </button>
              }
            </div>
          </div>
        }

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          @if (data.item) {
            <button
              type="button"
              (click)="remove()"
              [disabled]="loading()"
              class="text-sm text-danger hover:underline"
            >
              Eliminar
            </button>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button
              type="button"
              (click)="ref.close()"
              class="px-4 py-2 text-sm rounded hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class ListItemDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ListsService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly selectedTags = signal<Set<string>>(new Set());

  protected readonly fields: ListField[];
  protected readonly form;
  private readonly customControls = new Map<string, FormControl>();

  constructor(
    public ref: MatDialogRef<ListItemDialogComponent, ListItemDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ListItemDialogData,
  ) {
    this.fields = (data.list.fields ?? []).slice().sort((a, b) => a.position - b.position);

    const item = data.item;
    this.form = this.fb.nonNullable.group({
      title: [item?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      imageUrl: [item?.imageUrl ?? ''],
    });

    for (const field of this.fields) {
      const stored = item?.customFields?.[field.id];
      const validators = field.isRequired ? [Validators.required] : [];
      const initial = this.normalizeForControl(stored, field);
      this.customControls.set(field.id, new FormControl(initial, { validators }));
    }

    if (item?.imageUrl) this.imagePreview.set(item.imageUrl);
    this.form.controls.imageUrl.valueChanges.subscribe((url) => {
      this.imagePreview.set(url && url.trim().length > 0 ? url : null);
    });

    if (item?.tags?.length) {
      this.selectedTags.set(new Set(item.tags.map((t) => t.tagId)));
    }
  }

  customControl(fieldId: string): FormControl {
    return this.customControls.get(fieldId)!;
  }

  fieldOptions(field: ListField): string[] {
    const raw = field.options as { options?: unknown[] } | null;
    if (!raw?.options || !Array.isArray(raw.options)) return [];
    return raw.options.map((o) => String(o));
  }

  toggleTag(tagId: string): void {
    const next = new Set(this.selectedTags());
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    this.selectedTags.set(next);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    for (const ctrl of this.customControls.values()) ctrl.markAsTouched();
    const anyInvalid = Array.from(this.customControls.values()).some((c) => c.invalid);
    if (anyInvalid) {
      this.error.set('Hay campos requeridos sin completar');
      return;
    }
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const customFields: Record<string, unknown> = {};
    for (const field of this.fields) {
      const value = this.customControls.get(field.id)?.value;
      if (value !== '' && value !== null && value !== undefined) {
        customFields[field.id] = this.normalizeForBackend(value, field);
      }
    }

    const payload = {
      title: raw.title.trim(),
      imageUrl: raw.imageUrl?.trim() || undefined,
      customFields,
      tagIds: Array.from(this.selectedTags()),
    };

    const request$ = this.data.item
      ? this.service.updateItem(this.data.list.id, this.data.item.id, payload)
      : this.service.createItem(this.data.list.id, payload);

    request$.subscribe({
      next: (item) => {
        this.toastr.success(this.data.item ? 'Ítem actualizado' : 'Ítem creado');
        this.ref.close(item);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  remove(): void {
    if (!this.data.item || this.loading()) return;
    if (!confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.')) return;
    this.loading.set(true);
    this.service.deleteItem(this.data.list.id, this.data.item.id).subscribe({
      next: () => {
        this.toastr.success('Ítem eliminado');
        this.ref.close(undefined);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  private normalizeForControl(stored: unknown, field: ListField): unknown {
    if (stored === undefined || stored === null) {
      if (field.fieldType === 'BOOLEAN') return false;
      return '';
    }
    if (field.fieldType === 'MULTI_SELECT' && Array.isArray(stored)) {
      return stored.join(', ');
    }
    return stored;
  }

  private normalizeForBackend(value: unknown, field: ListField): unknown {
    if (field.fieldType === 'NUMBER' || field.fieldType === 'RATING') {
      return typeof value === 'number' ? value : Number(value);
    }
    if (field.fieldType === 'BOOLEAN') {
      return Boolean(value);
    }
    if (field.fieldType === 'MULTI_SELECT' && typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return value;
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Error inesperado';
  }
}
