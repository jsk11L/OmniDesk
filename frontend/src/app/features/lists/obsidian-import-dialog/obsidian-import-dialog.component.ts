import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type {
  DetectedField,
  ImportAnalysis,
  ListFieldType,
  ObsidianImportConfig,
} from '../lists.types';

export interface ObsidianImportDialogData {
  fileName: string;
  analysis: ImportAnalysis;
}

interface FieldRow extends DetectedField {
  name: string;
  type: ListFieldType;
  include: boolean;
}

const FIELD_TYPES: { value: ListFieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'URL', label: 'URL' },
  { value: 'BOOLEAN', label: 'Yes / No' },
  { value: 'SELECT', label: 'Select' },
  { value: 'MULTI_SELECT', label: 'Multi-select' },
  { value: 'RATING', label: 'Rating' },
  { value: 'IMAGE_URL', label: 'Image URL' },
];

@Component({
  selector: 'app-obsidian-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text w-[min(760px,96vw)] max-h-[90vh] flex flex-col">
      <div class="p-5 border-b border-border-soft">
        <h2 class="text-lg font-semibold">Import from Obsidian</h2>
        <p class="text-sm text-text-muted mt-0.5">
          {{ data.analysis.noteCount }} notes · {{ data.analysis.tagCount }} tags ·
          {{ rows().length }} fields detected. Adjust each field before importing.
        </p>
      </div>

      <div class="p-5 overflow-y-auto space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">List name</span>
          <input
            type="text"
            [(ngModel)]="listName"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        @if (rows().length === 0) {
          <p class="text-sm text-text-muted">
            No frontmatter fields were found — items will be created from note titles only.
          </p>
        } @else {
          <div class="border border-border-soft rounded-lg overflow-hidden">
            <div class="grid grid-cols-[auto_1.4fr_1fr_1.6fr] gap-2 px-3 py-2 bg-surface-2 text-xs uppercase-tag">
              <span>Use</span>
              <span>Field name</span>
              <span>Type</span>
              <span>Samples / notes</span>
            </div>
            @for (row of rows(); track row.key) {
              <div
                class="grid grid-cols-[auto_1.4fr_1fr_1.6fr] gap-2 px-3 py-2.5 border-t border-border-soft items-center"
                [class.opacity-50]="!row.include"
              >
                <input type="checkbox" [(ngModel)]="row.include" (ngModelChange)="refresh()" class="accent-primary" />

                <input
                  type="text"
                  [(ngModel)]="row.name"
                  [disabled]="!row.include"
                  class="px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary disabled:opacity-60"
                />

                <select
                  [(ngModel)]="row.type"
                  (ngModelChange)="refresh()"
                  [disabled]="!row.include"
                  class="px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary disabled:opacity-60"
                >
                  @for (t of fieldTypes; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>

                <div class="min-w-0">
                  <p class="text-xs text-text-faint truncate mono" [title]="row.sampleValues.join(' · ')">
                    {{ row.sampleValues.length ? row.sampleValues.join(' · ') : '—' }}
                  </p>
                  <p class="text-[11px] text-text-muted">
                    in {{ row.noteCount }} of {{ data.analysis.noteCount }} notes
                  </p>
                  @if (warningFor(row); as w) {
                    <p class="text-[11px] text-warning mt-0.5">⚠ {{ w }}</p>
                  }
                </div>
              </div>
            }
          </div>

          <p class="text-xs text-text-muted">
            Folders &amp; <span class="mono">tags</span> become list tags automatically. Unchecked fields are skipped.
          </p>
        }
      </div>

      <div class="p-4 border-t border-border-soft flex items-center justify-end gap-2">
        <button type="button" (click)="cancel()" class="px-4 py-2 rounded text-sm hover:bg-surface-hover">
          Cancel
        </button>
        <button type="button" (click)="confirm()" [disabled]="!listName.trim()"
          class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
          Import {{ includedCount() }} fields
        </button>
      </div>
    </div>
  `,
})
export class ObsidianImportDialogComponent {
  protected readonly fieldTypes = FIELD_TYPES;
  protected listName: string;
  protected readonly rows = signal<FieldRow[]>([]);
  /** Bumped on any change so computed-style getters re-read in OnPush. */
  private readonly tick = signal(0);

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: ObsidianImportDialogData,
    private readonly ref: MatDialogRef<ObsidianImportDialogComponent, ObsidianImportConfig | undefined>,
  ) {
    this.listName = data.fileName.replace(/\.zip$/i, '') || 'Imported from Obsidian';
    this.rows.set(
      data.analysis.fields.map((f) => ({
        ...f,
        name: f.suggestedName,
        type: f.suggestedType,
        include: true,
      })),
    );
  }

  protected refresh(): void {
    this.tick.update((n) => n + 1);
  }

  protected includedCount(): number {
    this.tick();
    return this.rows().filter((r) => r.include).length;
  }

  /** Warns when the chosen type doesn't match the sampled values. */
  protected warningFor(row: FieldRow): string | null {
    if (!row.include) return null;
    if (row.type === 'NUMBER' && row.numericCount < row.totalValues) {
      return `${row.totalValues - row.numericCount} of ${row.totalValues} values aren't numbers — they'll be kept as text`;
    }
    if (row.type === 'DATE' && row.dateCount < row.totalValues) {
      return `${row.totalValues - row.dateCount} of ${row.totalValues} values aren't valid dates`;
    }
    if (row.type === 'MULTI_SELECT' && row.arrayCount === 0) {
      return `single values will become one-item lists`;
    }
    return null;
  }

  protected cancel(): void {
    this.ref.close(undefined);
  }

  protected confirm(): void {
    const config: ObsidianImportConfig = {
      name: this.listName.trim(),
      fields: this.rows().map((r) => ({
        key: r.key,
        name: r.name.trim() || r.key,
        type: r.type,
        include: r.include,
      })),
    };
    this.ref.close(config);
  }
}
