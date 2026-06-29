import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type { List, ListField, ListItem } from '../lists.types';

export interface MoveItemDialogData {
  sourceList: List;
  item: ListItem;
  targetList: List;
}

/** The customFieldsPatch to merge on top of the name-based auto-map (or undefined to cancel). */
export type MoveItemDialogResult = { customFieldsPatch: Record<string, unknown> } | undefined;

@Component({
  selector: 'app-move-item-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text w-[min(560px,95vw)] max-h-[90vh] flex flex-col">
      <div class="p-5 border-b border-border-soft">
        <h2 class="text-lg font-semibold">Move to "{{ data.targetList.name }}"</h2>
        <p class="text-sm text-text-muted mt-0.5">
          "{{ data.item.title }}" moves to <strong>{{ data.targetList.name }}</strong>. Matching fields
          carry over automatically — fill in or adjust the rest.
        </p>
      </div>

      <div class="p-5 overflow-y-auto space-y-3">
        @if (fields.length === 0) {
          <p class="text-sm text-text-muted">The target list has no custom fields.</p>
        }
        @for (f of fields; track f.id) {
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">
              {{ f.name }}
              @if (carried.has(f.id)) { <span class="text-text-faint">· carried over</span> }
            </span>

            @switch (inputKind(f)) {
              @case ('select') {
                <select [(ngModel)]="values[f.id]"
                  class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                  <option value="">—</option>
                  @for (o of optionsOf(f); track o) { <option [value]="o">{{ o }}</option> }
                </select>
              }
              @case ('number') {
                <input type="number" [(ngModel)]="values[f.id]"
                  class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
              }
              @case ('date') {
                <input type="date" [(ngModel)]="values[f.id]"
                  class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
              }
              @case ('boolean') {
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" [(ngModel)]="values[f.id]" class="accent-primary" /> Yes
                </label>
              }
              @default {
                <input type="text" [(ngModel)]="values[f.id]"
                  class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
              }
            }
          </label>
        }
      </div>

      <div class="p-4 border-t border-border-soft flex justify-end gap-2">
        <button type="button" (click)="ref.close()" class="px-4 py-2 rounded text-sm hover:bg-surface-hover">Cancel</button>
        <button type="button" (click)="confirm()"
          class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">
          Move item
        </button>
      </div>
    </div>
  `,
})
export class MoveItemDialogComponent {
  protected readonly fields: ListField[];
  /** Target field ids that were auto-filled from a same-named source field. */
  protected readonly carried = new Set<string>();
  protected values: Record<string, string | boolean> = {};

  constructor(
    public ref: MatDialogRef<MoveItemDialogComponent, MoveItemDialogResult>,
    @Inject(MAT_DIALOG_DATA) protected readonly data: MoveItemDialogData,
  ) {
    this.fields = (data.targetList.fields ?? []).slice().sort((a, b) => a.position - b.position);

    const sourceByName = new Map<string, ListField>();
    for (const f of data.sourceList.fields ?? []) sourceByName.set(f.name.trim().toLowerCase(), f);
    const cf = data.item.customFields ?? {};

    for (const tf of this.fields) {
      const src = sourceByName.get(tf.name.trim().toLowerCase());
      const raw = src ? cf[src.id] : undefined;
      if (raw !== undefined && raw !== null && raw !== '') {
        this.carried.add(tf.id);
        if (tf.fieldType === 'BOOLEAN') this.values[tf.id] = Boolean(raw);
        else if (Array.isArray(raw)) this.values[tf.id] = raw.join(', ');
        else this.values[tf.id] = String(raw);
      } else {
        this.values[tf.id] = tf.fieldType === 'BOOLEAN' ? false : '';
      }
    }
  }

  protected inputKind(f: ListField): 'select' | 'number' | 'date' | 'boolean' | 'text' {
    switch (f.fieldType) {
      case 'SELECT':
        return 'select';
      case 'NUMBER':
      case 'RATING':
        return 'number';
      case 'DATE':
        return 'date';
      case 'BOOLEAN':
        return 'boolean';
      default:
        return 'text';
    }
  }

  protected optionsOf(field: ListField): string[] {
    const raw = field.options as { options?: unknown[] } | null;
    if (!raw?.options || !Array.isArray(raw.options)) return [];
    return raw.options.map((o) => String(o));
  }

  protected confirm(): void {
    const patch: Record<string, unknown> = {};
    for (const f of this.fields) {
      const v = this.values[f.id];
      if (v === '' || v === undefined || v === null) continue;
      if (f.fieldType === 'NUMBER' || f.fieldType === 'RATING') {
        const n = Number(v);
        patch[f.id] = Number.isNaN(n) ? v : n;
      } else if (f.fieldType === 'MULTI_SELECT') {
        patch[f.id] = String(v)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        patch[f.id] = v;
      }
    }
    this.ref.close({ customFieldsPatch: patch });
  }
}
