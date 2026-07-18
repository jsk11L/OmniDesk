import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type {
  List,
  ListAction,
  ActionsPosition,
  ActionsAlign,
  ListField,
  ListFieldType,
  ListTag,
  UpdateListFieldDto,
  ViewConfig,
} from '../lists.types';

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
  imports: [ReactiveFormsModule, FormsModule, MatDialogModule],
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
              <li class="text-sm bg-background rounded border border-border">
                <div class="flex items-center justify-between px-3 py-2">
                  <div class="min-w-0">
                    <span class="font-medium">{{ f.name }}</span>
                    <span class="text-xs text-text-muted ml-2">{{ fieldTypeLabel(f.fieldType) }}</span>
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
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" (click)="startEdit(f)"
                      class="px-1 text-text-muted hover:text-primary" title="Edit field">✏️</button>
                    <button type="button" (click)="deleteField(f)"
                      class="px-1 text-text-muted hover:text-danger" aria-label="Delete field">×</button>
                  </div>
                </div>

                @if (editingFieldId() === f.id) {
                  <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="px-3 pb-3 pt-1 border-t border-border space-y-2">
                    <div class="grid grid-cols-3 gap-2">
                      <input type="text" formControlName="name" maxlength="100" placeholder="Field name"
                        class="col-span-2 px-3 py-2 bg-surface border border-border rounded outline-none focus:border-primary text-sm" />
                      <select formControlName="fieldType"
                        class="px-3 py-2 bg-surface border border-border rounded outline-none focus:border-primary text-sm">
                        @for (t of fieldTypes; track t.value) {
                          <option [value]="t.value">{{ t.label }}</option>
                        }
                      </select>
                    </div>
                    @if (editFieldType() === 'SELECT' || editFieldType() === 'MULTI_SELECT') {
                      <input type="text" formControlName="options" placeholder="Options, comma-separated"
                        class="w-full px-3 py-2 bg-surface border border-border rounded outline-none focus:border-primary text-sm" />
                    }
                    <label class="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                      <input type="checkbox" formControlName="isRequired" class="accent-primary" /> Required field
                    </label>
                    @for (w of editWarnings(); track w) {
                      <p class="text-xs text-warning">⚠ {{ w }}</p>
                    }
                    <div class="flex gap-2 pt-1">
                      <button type="submit" [disabled]="savingField()"
                        class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
                        {{ savingField() ? 'Saving…' : 'Save changes' }}
                      </button>
                      <button type="button" (click)="cancelEdit()"
                        class="px-3 py-1.5 text-sm rounded hover:bg-surface-hover">Cancel</button>
                    </div>
                  </form>
                }
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

      <section class="mb-6">
        <h3 class="text-sm font-medium mb-1">Item action buttons</h3>
        <p class="text-xs text-text-muted mb-3">
          One-click buttons on cards: set a Select field to a value, or move the item to another
          list (carrying matching fields over — e.g. a backlog → "Completed").
        </p>

        @if (actions().length) {
          <ul class="space-y-1 mb-3">
            @for (a of actions(); track a.id) {
              <li class="flex items-center justify-between text-sm bg-background px-3 py-2 rounded border border-border">
                <span class="min-w-0 truncate">
                  <span class="font-medium" [style.color]="a.color || null">{{ a.label }}</span>
                  @if (a.kind === 'move') {
                    <span class="text-xs text-text-muted ml-2">→ move to {{ targetListName(a.targetListId) }}</span>
                  } @else {
                    <span class="text-xs text-text-muted ml-2">→ {{ fieldName(a.fieldId) }} = {{ a.value }}</span>
                  }
                </span>
                <button type="button" (click)="removeAction(a.id)" class="text-text-muted hover:text-danger shrink-0" aria-label="Remove action">×</button>
              </li>
            }
          </ul>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Buttons position</span>
              <select [ngModel]="actionsPosition()" (ngModelChange)="setActionsPosition($event)"
                class="w-full px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                <option value="below">Below card</option>
                <option value="above">Above card</option>
                <option value="overlay-top">Overlay · top</option>
                <option value="overlay-bottom">Overlay · bottom</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Buttons alignment</span>
              <select [ngModel]="actionsAlign()" (ngModelChange)="setActionsAlign($event)"
                class="w-full px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        }

        <!-- Set-a-field action -->
        <p class="uppercase-tag mb-1">Set a field</p>
        @if (selectFields().length === 0) {
          <p class="text-xs text-text-muted mb-4">Add a Select field first to create set-field actions.</p>
        } @else {
          <form [formGroup]="actionForm" (ngSubmit)="addAction()" class="grid grid-cols-2 gap-2 mb-4">
            <input type="text" formControlName="label" placeholder="Button label" maxlength="40"
              class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm" />
            <input type="color" formControlName="color" class="w-full h-10 bg-background border border-border rounded cursor-pointer" />
            <select formControlName="fieldId" class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm">
              <option value="">Select field…</option>
              @for (f of selectFields(); track f.id) {
                <option [value]="f.id">{{ f.name }}</option>
              }
            </select>
            <select formControlName="value" class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm">
              <option value="">Value…</option>
              @for (o of actionValueOptions(); track o) {
                <option [value]="o">{{ o }}</option>
              }
            </select>
            <button type="submit" [disabled]="actionForm.invalid"
              class="col-span-2 px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              + Add set action
            </button>
          </form>
        }

        <!-- Move-to-list action -->
        <p class="uppercase-tag mb-1">Move to another list</p>
        @if (otherLists().length === 0) {
          <p class="text-xs text-text-muted">Create another list to enable "move" buttons.</p>
        } @else {
          <form [formGroup]="moveActionForm" (ngSubmit)="addMoveAction()" class="grid grid-cols-2 gap-2">
            <input type="text" formControlName="label" placeholder="Button label — e.g. ✓ Complete" maxlength="40"
              class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm" />
            <input type="color" formControlName="color" class="w-full h-10 bg-background border border-border rounded cursor-pointer" />
            <select formControlName="targetListId" class="col-span-2 px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm">
              <option value="">Target list…</option>
              @for (l of otherLists(); track l.id) {
                <option [value]="l.id">{{ l.name }}</option>
              }
            </select>
            <button type="submit" [disabled]="moveActionForm.invalid"
              class="col-span-2 px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              + Add move button
            </button>
          </form>
        }
      </section>

      <section class="mb-6">
        <h3 class="text-sm font-medium mb-1">Extras</h3>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" [checked]="rouletteOn()" (change)="toggleRoulette()" class="accent-primary" />
          🎲 Random picker button
        </label>
        <p class="text-xs text-text-muted mt-1">
          Adds a button in the list header that spins a roulette and opens a random item
          (respects the current filters).
        </p>
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

  // ─── Editing an existing field ───────────────────────────
  protected readonly editingFieldId = signal<string | null>(null);
  protected readonly editFieldType = signal<ListFieldType>('TEXT');
  protected readonly savingField = signal(false);
  private editOriginal: ListField | null = null;

  protected readonly actions = signal<ListAction[]>([]);
  /** Mirrors actionForm.fieldId so the value dropdown reacts under OnPush. */
  protected readonly actionFieldId = signal<string>('');
  /** Other lists (move-action targets), excluding this one. */
  protected readonly otherLists = signal<List[]>([]);
  /** Whether the 🎲 random-picker button is enabled for this list. */
  protected readonly rouletteOn = signal(false);
  /** Position + alignment of the action-button row on cards. */
  protected readonly actionsPosition = signal<ActionsPosition>('below');
  protected readonly actionsAlign = signal<ActionsAlign>('left');

  protected readonly selectFields = computed(() =>
    this.fields().filter((f) => f.fieldType === 'SELECT' || f.fieldType === 'MULTI_SELECT'),
  );

  protected readonly actionValueOptions = computed<string[]>(() => {
    const field = this.fields().find((f) => f.id === this.actionFieldId());
    return field ? this.optionsOf(field) : [];
  });

  protected readonly listForm;
  protected readonly fieldForm;
  protected readonly editForm;
  protected readonly tagForm;
  protected readonly actionForm;
  protected readonly moveActionForm;

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

    this.editForm = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      fieldType: ['TEXT' as ListFieldType],
      isRequired: [false],
      options: [''],
    });
    this.editForm.controls.fieldType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((t) => this.editFieldType.set(t));

    this.tagForm = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      color: ['#94a3b8'],
    });

    this.actions.set(list.viewConfig?.actions ?? []);
    this.rouletteOn.set(list.viewConfig?.enableRoulette === true);
    this.actionsPosition.set(list.viewConfig?.actionsPosition ?? 'below');
    this.actionsAlign.set(list.viewConfig?.actionsAlign ?? 'left');
    this.actionForm = this.fb.nonNullable.group({
      label: ['', [Validators.required, Validators.maxLength(40)]],
      color: ['#6366f1'],
      fieldId: ['', Validators.required],
      value: ['', Validators.required],
    });
    this.actionForm.controls.fieldId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => {
        this.actionFieldId.set(id);
        this.actionForm.controls.value.setValue('');
      });

    this.moveActionForm = this.fb.nonNullable.group({
      label: ['', [Validators.required, Validators.maxLength(40)]],
      color: ['#22c55e'],
      targetListId: ['', Validators.required],
    });

    // Other lists, for move-action targets.
    this.service.list().subscribe({
      next: (lists) => this.otherLists.set(lists.filter((l) => l.id !== list.id)),
      error: () => undefined,
    });
  }

  protected fieldName(fieldId: string | undefined): string {
    return this.fields().find((f) => f.id === fieldId)?.name ?? '—';
  }

  protected targetListName(listId: string | undefined): string {
    return this.otherLists().find((l) => l.id === listId)?.name ?? '—';
  }

  addAction(): void {
    if (this.actionForm.invalid) return;
    const raw = this.actionForm.getRawValue();
    const action: ListAction = {
      id: crypto.randomUUID(),
      label: raw.label.trim(),
      kind: 'set',
      fieldId: raw.fieldId,
      value: raw.value,
      color: raw.color,
    };
    this.saveActions([...this.actions(), action]);
    this.actionForm.reset({ label: '', color: '#6366f1', fieldId: '', value: '' });
    this.actionFieldId.set('');
  }

  addMoveAction(): void {
    if (this.moveActionForm.invalid) return;
    const raw = this.moveActionForm.getRawValue();
    const action: ListAction = {
      id: crypto.randomUUID(),
      label: raw.label.trim(),
      kind: 'move',
      targetListId: raw.targetListId,
      color: raw.color,
    };
    this.saveActions([...this.actions(), action]);
    this.moveActionForm.reset({ label: '', color: '#22c55e', targetListId: '' });
  }

  removeAction(id: string): void {
    this.saveActions(this.actions().filter((a) => a.id !== id));
  }

  toggleRoulette(): void {
    const next = !this.rouletteOn();
    this.rouletteOn.set(next);
    this.patchViewConfig({ enableRoulette: next });
  }

  setActionsPosition(pos: ActionsPosition): void {
    this.actionsPosition.set(pos);
    this.patchViewConfig({ actionsPosition: pos });
  }

  setActionsAlign(align: ActionsAlign): void {
    this.actionsAlign.set(align);
    this.patchViewConfig({ actionsAlign: align });
  }

  private patchViewConfig(patch: Partial<ViewConfig>): void {
    const viewConfig: Partial<ViewConfig> = { ...(this.data.list.viewConfig ?? {}), ...patch };
    this.data.list = { ...this.data.list, viewConfig };
    this.service.update(this.data.list.id, { viewConfig }).subscribe({
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  private saveActions(next: ListAction[]): void {
    this.actions.set(next);
    const viewConfig: Partial<ViewConfig> = { ...(this.data.list.viewConfig ?? {}), actions: next };
    this.data.list = { ...this.data.list, viewConfig };
    this.service.update(this.data.list.id, { viewConfig }).subscribe({
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
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

  protected fieldTypeLabel(t: ListFieldType): string {
    return FIELD_TYPES.find((x) => x.value === t)?.label ?? t;
  }

  startEdit(field: ListField): void {
    this.editOriginal = field;
    this.editFieldType.set(field.fieldType);
    this.editForm.reset({
      name: field.name,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      options: this.optionsOf(field).join(', '),
    });
    this.editingFieldId.set(field.id);
  }

  cancelEdit(): void {
    this.editingFieldId.set(null);
    this.editOriginal = null;
  }

  /** Live warnings about what the pending change implies. */
  protected editWarnings(): string[] {
    const orig = this.editOriginal;
    if (!orig || this.editingFieldId() !== orig.id) return [];
    const v = this.editForm.getRawValue();
    const isSel = (t: ListFieldType): boolean => t === 'SELECT' || t === 'MULTI_SELECT';
    const warns: string[] = [];

    if (v.fieldType !== orig.fieldType) {
      warns.push(
        `Type ${this.fieldTypeLabel(orig.fieldType)} → ${this.fieldTypeLabel(v.fieldType)}: existing values are kept as-is and may not fit the new type until you edit each item.`,
      );
    }
    if (isSel(orig.fieldType)) {
      const newOpts = this.parseOptions(v.options);
      const removed = this.optionsOf(orig).filter((o) => !newOpts.includes(o));
      if (removed.length) {
        warns.push(
          `Removing "${removed.join('", "')}": items set to those keep an orphaned value until you change them.`,
        );
      }
    }
    if (isSel(v.fieldType) && this.parseOptions(v.options).length === 0) {
      warns.push('A Select field needs at least one option.');
    }
    return warns;
  }

  saveEdit(): void {
    const orig = this.editOriginal;
    if (!orig || this.savingField()) return;
    const v = this.editForm.getRawValue();
    const name = v.name.trim();
    if (!name) {
      this.toastr.error('Field name is required');
      return;
    }
    const isSel = v.fieldType === 'SELECT' || v.fieldType === 'MULTI_SELECT';
    const dto: UpdateListFieldDto = { name, fieldType: v.fieldType, isRequired: v.isRequired };
    if (isSel) {
      const parsed = this.parseOptions(v.options);
      if (parsed.length === 0) {
        this.toastr.error('Add at least one option for a Select field');
        return;
      }
      dto.options = { options: parsed };
    }

    this.savingField.set(true);
    this.service.updateField(this.data.list.id, orig.id, dto).subscribe({
      next: (updated) => {
        this.savingField.set(false);
        this.fields.update((arr) => arr.map((f) => (f.id === updated.id ? updated : f)));
        this.cancelEdit();
        this.toastr.success('Field updated');
      },
      error: (err: HttpErrorResponse) => {
        this.savingField.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  async deleteField(field: ListField): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: `Delete field "${field.name}"`,
      message: `This removes the "${field.name}" column and its value from every item in this list. This can't be undone.`,
      confirmLabel: 'Delete field',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteField(this.data.list.id, field.id).subscribe({
      next: () => {
        this.fields.update((arr) => arr.filter((f) => f.id !== field.id));
        if (this.editingFieldId() === field.id) this.cancelEdit();
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
