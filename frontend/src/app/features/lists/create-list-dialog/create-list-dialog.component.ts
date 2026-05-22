import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { EmojiPickerComponent } from '../../../shared/components/emoji-picker/emoji-picker.component';
import { ImageInputComponent } from '../../../shared/components/image-input/image-input.component';
import type { List, ListViewType } from '../lists.types';

export type CreateListDialogResult = List | undefined;

@Component({
  selector: 'app-create-list-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    EmojiPickerComponent,
    ImageInputComponent,
  ],
  template: `
    <div class="bg-surface text-text p-6 w-[min(480px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">Nueva lista</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Nombre *</span>
          <input
            type="text"
            formControlName="name"
            autofocus
            maxlength="100"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            placeholder="Ej: Juegos, Libros, Series"
          />
        </label>

        <div class="flex gap-4 items-start">
          <div>
            <span class="block text-xs text-text-muted mb-1">Icono</span>
            <app-emoji-picker
              [initialValue]="icon()"
              placeholder="📚"
              (valueChange)="setIcon($event)"
            />
          </div>
          <div class="flex-1">
            <span class="block text-xs text-text-muted mb-1">Imagen de portada (opcional)</span>
            <app-image-input
              [initialValue]="cover()"
              (valueChange)="setCover($event)"
            />
          </div>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Vista por defecto</span>
          <select
            formControlName="defaultView"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          >
            <option value="GRID">Grid (tarjetas)</option>
            <option value="TABLE">Tabla</option>
            <option value="GALLERY">Galería</option>
            <option value="LIST">Lista</option>
          </select>
        </label>

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-end gap-2 pt-2">
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
            {{ loading() ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateListDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ListsService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly icon = signal<string | null>(null);
  protected readonly cover = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    defaultView: ['GRID' as ListViewType],
  });

  constructor(public ref: MatDialogRef<CreateListDialogComponent, CreateListDialogResult>) {}

  protected setIcon(v: string | null): void {
    this.icon.set(v);
  }

  protected setCover(v: string | null): void {
    this.cover.set(v);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const payload: { name: string; icon?: string; coverImageUrl?: string; defaultView: ListViewType } = {
      name: raw.name.trim(),
      defaultView: raw.defaultView,
    };
    const icon = this.icon();
    if (icon) payload.icon = icon;
    const cover = this.cover();
    if (cover) payload.coverImageUrl = cover;

    this.service.create(payload).subscribe({
      next: (list) => {
        this.toastr.success('Lista creada');
        this.ref.close(list);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        if (Array.isArray(msg)) this.error.set(msg.join('. '));
        else if (typeof msg === 'string') this.error.set(msg);
        else this.error.set('No se pudo crear la lista');
      },
    });
  }
}
