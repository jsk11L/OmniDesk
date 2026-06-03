import { ChangeDetectionStrategy, Component, Inject, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ImageInputComponent } from '../../../shared/components/image-input/image-input.component';
import type { List, ListField, ListItem } from '../lists.types';

export interface ListItemDialogData {
  list: List;
  item?: ListItem;
}

export type ListItemDialogResult = ListItem | undefined;

@Component({
  selector: 'app-list-item-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, MatDialogModule, ImageInputComponent],
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

        @if (fields.length > 0) {
          <div class="border-t border-border pt-4 space-y-3">
            <p class="text-xs font-medium text-text-muted">Campos personalizados</p>
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
                    <input type="text" [formControl]="customControl(field.id)"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                  @case ('NUMBER') {
                    <input type="number" [formControl]="customControl(field.id)"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                  @case ('URL') {
                    <input type="url" [formControl]="customControl(field.id)" placeholder="https://…"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                  @case ('IMAGE_URL') {
                    <app-image-input
                      [initialValue]="customControl(field.id).value ?? null"
                      (valueChange)="setImageField(field.id, $event)"
                    />
                  }
                  @case ('DATE') {
                    <input type="date" [formControl]="customControl(field.id)"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                  @case ('BOOLEAN') {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [formControl]="customControl(field.id)" class="accent-primary" />
                      <span class="text-sm">Sí</span>
                    </label>
                  }
                  @case ('RATING') {
                    <input type="number" min="0" max="10" step="1" [formControl]="customControl(field.id)" placeholder="0-10"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                  @case ('SELECT') {
                    <select [formControl]="customControl(field.id)"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
                      <option value="">—</option>
                      @for (opt of fieldOptions(field); track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  }
                  @case ('MULTI_SELECT') {
                    <input type="text" [formControl]="customControl(field.id)" placeholder="Valores separados por coma"
                      class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
                  }
                }
              </div>
            }
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
            <div class="flex gap-3 items-center">
              <button type="button" (click)="remove()" [disabled]="loading()" class="text-sm text-danger hover:underline">
                Eliminar
              </button>
              <button type="button" (click)="movePanelOpen.set(!movePanelOpen())" [disabled]="loading()"
                class="text-sm text-text-muted hover:text-text">
                {{ movePanelOpen() ? '✕ Cancelar mover' : 'Mover a…' }}
              </button>
            </div>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">
              Cancelar
            </button>
            <button type="submit" [disabled]="form.invalid || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>

      @if (data.item && movePanelOpen()) {
        <div class="mt-4 border-t border-border pt-4">
          <p class="text-xs font-medium text-text-muted mb-2">Mover a otra lista</p>
          <p class="text-xs text-text-faint mb-3">
            Los campos cuyo nombre coincida se traspasan automáticamente.
            Podés sobrescribir abajo (por ejemplo, marcar Mes/Año de completación).
          </p>

          <select [(ngModel)]="targetListId" (ngModelChange)="onTargetChange($event)"
            class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary mb-3">
            <option value="">Seleccionar lista destino…</option>
            @for (l of otherLists(); track l.id) {
              <option [value]="l.id">{{ l.icon ?? '📚' }} {{ l.name }}</option>
            }
          </select>

          @if (targetList(); as target) {
            <div class="space-y-2">
              @for (f of targetFields(); track f.id) {
                <div>
                  <span class="block text-xs text-text-muted mb-1">{{ f.name }}
                    @if (autoMapped().has(f.name.trim().toLowerCase())) {
                      <span class="text-text-faint">(auto)</span>
                    }
                  </span>
                  @switch (f.fieldType) {
                    @case ('NUMBER') {
                      <input type="number" [(ngModel)]="moveOverrides[f.id]" [placeholder]="placeholderFor(f)"
                        class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
                    }
                    @case ('DATE') {
                      <input type="date" [(ngModel)]="moveOverrides[f.id]"
                        class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
                    }
                    @case ('SELECT') {
                      <select [(ngModel)]="moveOverrides[f.id]"
                        class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                        <option value="">{{ placeholderFor(f) }}</option>
                        @for (opt of fieldOptions(f); track opt) {
                          <option [value]="opt">{{ opt }}</option>
                        }
                      </select>
                    }
                    @default {
                      <input type="text" [(ngModel)]="moveOverrides[f.id]" [placeholder]="placeholderFor(f)"
                        class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
                    }
                  }
                </div>
              }
              <div class="flex gap-2 pt-2">
                <button type="button" (click)="autofillCompletion()"
                  class="text-xs text-primary hover:underline">
                  Autorrellenar (mes/año actuales · índice)
                </button>
              </div>
            </div>
          }

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" (click)="executeMove()" [disabled]="!targetListId || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {{ loading() ? 'Moviendo…' : 'Confirmar mover →' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ListItemDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ListsService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedTags = signal<Set<string>>(new Set());

  // Move-panel state
  protected readonly movePanelOpen = signal(false);
  protected readonly allLists = signal<List[]>([]);
  protected readonly otherLists = signal<List[]>([]);
  protected readonly targetList = signal<List | null>(null);
  protected readonly targetFields = signal<ListField[]>([]);
  protected readonly autoMapped = signal<Set<string>>(new Set());
  protected targetListId = '';
  protected moveOverrides: Record<string, string | number | null> = {};

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
    });

    for (const field of this.fields) {
      const stored = item?.customFields?.[field.id];
      const validators = field.isRequired ? [Validators.required] : [];
      const initial = this.normalizeForControl(stored, field);
      this.customControls.set(field.id, new FormControl(initial, { validators }));
    }

    if (item?.tags?.length) {
      this.selectedTags.set(new Set(item.tags.map((t) => t.tagId)));
    }
  }

  ngOnInit(): void {
    if (!this.data.item) return;
    this.service.list().subscribe({
      next: (lists) => {
        this.allLists.set(lists);
        this.otherLists.set(lists.filter((l) => l.id !== this.data.list.id));
      },
      error: () => undefined,
    });
  }

  customControl(fieldId: string): FormControl {
    return this.customControls.get(fieldId)!;
  }

  onTargetChange(targetListId: string): void {
    this.moveOverrides = {};
    this.targetList.set(null);
    this.targetFields.set([]);
    this.autoMapped.set(new Set());
    if (!targetListId) return;

    this.service.findById(targetListId).subscribe({
      next: (target) => {
        this.targetList.set(target);
        const tFields = (target.fields ?? []).slice().sort((a, b) => a.position - b.position);
        this.targetFields.set(tFields);

        const sourceFieldNames = new Set(
          this.fields.map((f) => f.name.trim().toLowerCase()),
        );
        const auto = new Set<string>();
        for (const f of tFields) {
          if (sourceFieldNames.has(f.name.trim().toLowerCase())) {
            auto.add(f.name.trim().toLowerCase());
          }
        }
        this.autoMapped.set(auto);
      },
      error: () => this.toastr.error('No se pudo cargar la lista destino'),
    });
  }

  placeholderFor(field: ListField): string {
    if (this.autoMapped().has(field.name.trim().toLowerCase())) {
      return 'Se rellena automáticamente desde el ítem';
    }
    return field.defaultValue ?? '';
  }

  /**
   * Auto-fill common completion values: current month, current year, computed
   * index (count of existing items in destination + 1). The user can edit any
   * field afterwards before confirming.
   */
  autofillCompletion(): void {
    const target = this.targetList();
    if (!target) return;
    const now = new Date();
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthLabel = months[now.getMonth()];
    const year = now.getFullYear();

    this.service.listItems(target.id, {}).subscribe({
      next: (items) => {
        const nextIndex = items.length + 1;
        for (const f of this.targetFields()) {
          const name = f.name.trim().toLowerCase();
          if (this.moveOverrides[f.id]) continue;
          if (/(mes|month)/.test(name)) this.moveOverrides[f.id] = monthLabel;
          else if (/(año|year|anio)/.test(name)) this.moveOverrides[f.id] = year;
          else if (/(índice|indice|index|n°|#)/.test(name)) this.moveOverrides[f.id] = nextIndex;
          else if (/(fecha|date)/.test(name) && f.fieldType === 'DATE') {
            this.moveOverrides[f.id] = now.toISOString().slice(0, 10);
          }
        }
        // Trigger change detection by replacing the object reference
        this.moveOverrides = { ...this.moveOverrides };
      },
      error: () => this.toastr.error('No se pudieron contar los ítems destino'),
    });
  }

  executeMove(): void {
    if (!this.data.item || !this.targetListId || this.loading()) return;
    this.loading.set(true);
    const patch: Record<string, unknown> = {};
    for (const [id, value] of Object.entries(this.moveOverrides)) {
      if (value === '' || value === null || value === undefined) continue;
      patch[id] = value;
    }
    this.service
      .moveItem(this.data.list.id, this.data.item.id, {
        targetListId: this.targetListId,
        customFieldsPatch: Object.keys(patch).length ? patch : undefined,
      })
      .subscribe({
        next: (moved) => {
          this.toastr.success(`Movido a "${this.targetList()?.name}"`);
          this.ref.close(moved);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(this.errMsg(err));
        },
      });
  }

  fieldOptions(field: ListField): string[] {
    const raw = field.options as { options?: unknown[] } | null;
    if (!raw?.options || !Array.isArray(raw.options)) return [];
    return raw.options.map((o) => String(o));
  }

  setImageField(fieldId: string, value: string | null): void {
    this.customControls.get(fieldId)?.setValue(value);
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

  async remove(): Promise<void> {
    if (!this.data.item || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Eliminar ítem',
      message: '¿Eliminar este ítem? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
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
