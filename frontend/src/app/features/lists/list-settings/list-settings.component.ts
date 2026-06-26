import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type { List, ListField, ListFieldType, ListTag } from '../lists.types';

export interface ListSettingsData {
  list: List;
}

const FIELD_TYPES: { value: ListFieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'URL', label: 'URL' },
  { value: 'BOOLEAN', label: 'Yes/No' },
  { value: 'SELECT', label: 'Select' },
  { value: 'MULTI_SELECT', label: 'Multi-select' },
  { value: 'RATING', label: 'Rating 0-10' },
  { value: 'IMAGE_URL', label: 'Image URL' },
];

@Component({
  selector: 'app-list-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-semibold">List settings</h2>
        <button
          type="button"
          (click)="deleteList()"
          class="text-sm text-danger hover:underline"
        >
          Delete list
        </button>
      </div>

      <section class="mb-6">
        <h3 class="text-sm font-medium mb-3">Details</h3>
        <form [formGroup]="listForm" (ngSubmit)="saveList()" class="space-y-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Name</span>
            <input
              type="text"
              formControlName="name"
              maxlength="100"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Description</span>
            <textarea
              formControlName="description"
              rows="2"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
            ></textarea>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Icon</span>
              <input
                type="text"
                formControlName="icon"
                maxlength="4"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              />
            </label>
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Default view</span>
              <select
                formControlName="defaultView"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              >
                <option value="GRID">Grid</option>
                <option value="TABLE">Table</option>
                <option value="GALLERY">Gallery</option>
                <option value="LIST">List</option>
              </select>
            </label>
          </div>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Cover URL</span>
            <input
              type="url"
              formControlName="coverImageUrl"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              placeholder="https://…"
            />
          </label>
          <button
            type="submit"
            [disabled]="listForm.invalid || savingList()"
            class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {{ savingList() ? 'Saving…' : 'Save details' }}
          </button>
        </form>
      </section>

      <section class="mb-6">
        <h3 class="text-sm font-medium mb-3">Custom fields</h3>
        @if (fields().length === 0) {
          <p class="text-xs text-text-muted mb-3">No custom fields yet.</p>
        } @else {
          <ul class="space-y-1 mb-3">
            @for (f of fields(); track f.id) {
              <li
                class="flex items-center justify-between text-sm bg-background px-3 py-2 rounded border border-border"
              >
                <div class="min-w-0">
                  <span class="font-medium">{{ f.name }}</span>
                  <span class="text-xs text-text-muted ml-2">{{ f.fieldType }}</span>
                  @if (f.isRequired) {
                    <span class="text-xs text-danger ml-1">required</span>
                  }
                  @if (optionsOf(f).length) {
                    <div class="flex flex-wrap gap-1 mt-1">
                      @for (o of optionsOf(f); track o) {
                        <span class="text-xs px-1.5 py-0.5 rounded bg-surface text-text-muted">{{ o }}</span>
                      }
                    </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="deleteField(f.id)"
                  class="text-text-muted hover:text-danger"
                  aria-label="Delete field"
                >
                  ×
                </button>
              </li>
            }
          </ul>
        }
        <form [formGroup]="fieldForm" (ngSubmit)="addField()" class="grid grid-cols-3 gap-2">
          <input
            type="text"
            formControlName="name"
            placeholder="Field name"
            maxlength="100"
            class="col-span-2 px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm"
          />
          <select
            formControlName="fieldType"
            class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm"
          >
            @for (t of fieldTypes; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
          @if (newFieldType() === 'SELECT' || newFieldType() === 'MULTI_SELECT') {
            <div class="col-span-3">
              <input
                type="text"
                formControlName="options"
                placeholder="Options, comma-separated — e.g. Backlog, Playing, Completed"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm"
              />
              <p class="text-xs text-text-muted mt-1">
                These are the choices users pick from when filling this field.
              </p>
            </div>
          }
          <button
            type="submit"
            [disabled]="fieldForm.invalid"
            class="col-span-3 px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            + Add field
          </button>
        </form>
      </section>

      <section class="mb-2">
        <h3 class="text-sm font-medium mb-3">Predefined tags</h3>
        @if (tags().length === 0) {
          <p class="text-xs text-text-muted mb-3">No tags yet.</p>
        } @else {
          <ul class="space-y-1 mb-3">
            @for (t of tags(); track t.id) {
              <li
                class="flex items-center justify-between text-sm bg-background px-3 py-2 rounded border border-border"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full inline-block"
                    [style.background-color]="t.color"
                  ></span>
                  <span>{{ t.name }}</span>
                </div>
                <button
                  type="button"
                  (click)="deleteTag(t.id)"
                  class="text-text-muted hover:text-danger"
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </li>
            }
          </ul>
        }
        <form [formGroup]="tagForm" (ngSubmit)="addTag()" class="grid grid-cols-3 gap-2">
          <input
            type="text"
            formControlName="name"
            placeholder="Tag name"
            maxlength="50"
            class="col-span-2 px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm"
          />
          <input
            type="color"
            formControlName="color"
            class="w-full h-10 bg-background border border-border rounded cursor-pointer"
          />
          <button
            type="submit"
            [disabled]="tagForm.invalid"
            class="col-span-3 px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            + Add tag
          </button>
        </form>
      </section>

      <div class="flex justify-end pt-4 border-t border-border">
        <button
          type="button"
          (click)="ref.close('changed')"
          class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  `,
})
export class ListSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ListsService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly savingList = signal(false);
  protected readonly fields = signal<ListField[]>([]);
  protected readonly tags = signal<ListTag[]>([]);
  protected readonly fieldTypes = FIELD_TYPES;
  /** Mirrors fieldForm.fieldType so the options input shows/hides under OnPush. */
  protected readonly newFieldType = signal<ListFieldType>('TEXT');

  protected readonly listForm;
  protected readonly fieldForm;
  protected readonly tagForm;

  constructor(
    public ref: MatDialogRef<ListSettingsComponent, 'changed' | 'deleted' | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ListSettingsData,
  ) {
    const list = data.list;
    this.fields.set((list.fields ?? []).slice().sort((a, b) => a.position - b.position));
    this.tags.set(list.tags ?? []);

    this.listForm = this.fb.nonNullable.group({
      name: [list.name, [Validators.required, Validators.maxLength(100)]],
      description: [list.description ?? ''],
      icon: [list.icon ?? '', [Validators.maxLength(4)]],
      coverImageUrl: [list.coverImageUrl ?? ''],
      defaultView: [list.defaultView],
    });

    this.fieldForm = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      fieldType: ['TEXT' as ListFieldType],
      options: [''],
    });

    this.fieldForm.controls.fieldType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((t) => this.newFieldType.set(t));

    this.tagForm = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      color: ['#94a3b8'],
    });
  }

  saveList(): void {
    if (this.listForm.invalid || this.savingList()) return;
    this.savingList.set(true);
    const raw = this.listForm.getRawValue();
    this.service
      .update(this.data.list.id, {
        name: raw.name.trim(),
        description: raw.description.trim() || undefined,
        icon: raw.icon.trim() || undefined,
        coverImageUrl: raw.coverImageUrl.trim() || undefined,
        defaultView: raw.defaultView,
      })
      .subscribe({
        next: () => {
          this.savingList.set(false);
          this.toastr.success('Details saved');
        },
        error: (err: HttpErrorResponse) => {
          this.savingList.set(false);
          this.toastr.error(this.errMsg(err));
        },
      });
  }

  addField(): void {
    if (this.fieldForm.invalid) return;
    const raw = this.fieldForm.getRawValue();
    const needsOptions = raw.fieldType === 'SELECT' || raw.fieldType === 'MULTI_SELECT';

    let options: Record<string, unknown> | undefined;
    if (needsOptions) {
      const parsed = this.parseOptions(raw.options);
      if (parsed.length === 0) {
        this.toastr.error('Add at least one option for a Select field');
        return;
      }
      options = { options: parsed };
    }

    this.service
      .createField(this.data.list.id, {
        name: raw.name.trim(),
        fieldType: raw.fieldType,
        options,
      })
      .subscribe({
        next: (field) => {
          this.fields.update((arr) => [...arr, field]);
          this.fieldForm.reset({ name: '', fieldType: 'TEXT', options: '' });
          this.newFieldType.set('TEXT');
          this.toastr.success('Field added');
        },
        error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
      });
  }

  /** Reads the stored `{ options: [...] }` choices for a SELECT/MULTI_SELECT field. */
  protected optionsOf(field: ListField): string[] {
    const raw = field.options as { options?: unknown[] } | null;
    if (!raw?.options || !Array.isArray(raw.options)) return [];
    return raw.options.map((o) => String(o));
  }

  /** Splits the comma/newline-separated options input into a deduped list. */
  private parseOptions(raw: string): string[] {
    const seen = new Set<string>();
    return raw
      .split(/[,\n]/)
      .map((o) => o.trim())
      .filter((o) => o.length > 0 && !seen.has(o) && seen.add(o));
  }

  async deleteField(fieldId: string): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: 'Delete field',
      message: 'Delete this field? Values on items will be orphaned.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteField(this.data.list.id, fieldId).subscribe({
      next: () => {
        this.fields.update((arr) => arr.filter((f) => f.id !== fieldId));
        this.toastr.success('Field deleted');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  addTag(): void {
    if (this.tagForm.invalid) return;
    const raw = this.tagForm.getRawValue();
    this.service
      .createTag(this.data.list.id, { name: raw.name.trim(), color: raw.color })
      .subscribe({
        next: (tag) => {
          this.tags.update((arr) => [...arr, tag]);
          this.tagForm.reset({ name: '', color: '#94a3b8' });
          this.toastr.success('Tag added');
        },
        error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
      });
  }

  async deleteTag(tagId: string): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: 'Delete tag',
      message: 'Delete this tag?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteTag(this.data.list.id, tagId).subscribe({
      next: () => {
        this.tags.update((arr) => arr.filter((t) => t.id !== tagId));
        this.toastr.success('Tag deleted');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  async deleteList(): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: 'Delete list',
      message: `Delete the list "${this.data.list.name}" with all its items?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete(this.data.list.id).subscribe({
      next: () => {
        this.toastr.success('List deleted');
        this.ref.close('deleted');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
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
