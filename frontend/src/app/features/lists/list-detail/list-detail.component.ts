import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { UploadsService } from '../../../shared/services/uploads.service';
import { FavoritesStore } from '../../../shared/services/favorites.store';
import {
  ListItemDialogComponent,
  type ListItemDialogData,
  type ListItemDialogResult,
} from '../list-item-dialog/list-item-dialog.component';
import {
  ListSettingsComponent,
  type ListSettingsData,
} from '../list-settings/list-settings.component';
import {
  resolveGridConfig,
  resolveViewConfig,
  findImageField,
  CARD_MATRIX_SLOTS,
  DEFAULT_FIELD_LAYOUT,
  type GridConfig,
  type List,
  type ListField,
  type ListItem,
  type ViewConfig,
  type GridTemplate,
  type ListAction,
  type CardSlot,
  type FieldCardLayout,
  type DateDisplayFormat,
} from '../lists.types';

interface ItemGroup {
  key: string;
  label: string;
  items: ListItem[];
}

@Component({
  selector: 'app-list-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatDialogModule, TagChipComponent],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <div class="flex items-center justify-between gap-4 mb-3">
          <div class="flex items-center gap-3">
            <a routerLink="/app/lists" class="text-text-muted hover:text-text text-sm">← Listas</a>
            <h1 class="text-2xl font-semibold flex items-center gap-2">
              @if (list()?.icon) {
                <span>{{ list()!.icon }}</span>
              }
              {{ list()?.name ?? '…' }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            @if (list(); as l) {
              <button
                type="button"
                (click)="toggleFavorite(l.id)"
                [title]="isFavorite(l.id) ? 'Remove from sidebar favorites' : 'Add to sidebar favorites'"
                [class]="
                  'w-10 h-10 grid place-items-center rounded-lg text-lg transition-colors ' +
                  (isFavorite(l.id) ? 'text-accent hover:bg-surface-hover' : 'text-text-muted hover:bg-surface-hover hover:text-text')
                "
              >{{ isFavorite(l.id) ? '★' : '☆' }}</button>
            }
            <button type="button" (click)="openSettings()" class="px-3 py-2 rounded text-sm hover:bg-surface-hover">
              ⚙ Settings
            </button>
            <button type="button" (click)="openCreateItem()" [disabled]="!list()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              + New item
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="reload()"
            placeholder="Search…"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary w-64"
          />

          <select [ngModel]="gridConfig().template" (ngModelChange)="setTemplate($event)"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
            <option value="card-large">Large card</option>
            <option value="card-compact">Compact card</option>
            <option value="card-cover">Cover card (Obsidian)</option>
            <option value="dense-list">Dense list</option>
            <option value="gallery-no-image">Gallery without image</option>
            <option value="table">Table</option>
          </select>

          @if ((list()?.fields?.length ?? 0) > 0) {
            <div class="relative">
              <button type="button" (click)="fieldsPanelOpen.set(!fieldsPanelOpen())"
                class="px-3 py-2 bg-surface border border-border rounded text-sm hover:bg-surface-hover">
                ⚙ Fields
              </button>
              @if (fieldsPanelOpen()) {
                <div class="absolute z-30 mt-1 right-0 w-72 bg-surface border border-border rounded-lg shadow-lg p-2 max-h-[70vh] overflow-auto">
                  <p class="uppercase-tag px-2 pb-1">Fields shown on cards</p>
                  @for (f of fieldConfigRows(); track f.id) {
                    <div class="rounded hover:bg-surface-hover">
                      <div class="flex items-center gap-2 px-2 py-1.5 text-sm">
                        <input type="checkbox" [checked]="isFieldVisible(f.id)" (change)="toggleFieldVisible(f.id)" class="accent-primary" />
                        <span class="flex-1 truncate">{{ f.name }}</span>
                        @if (isFieldVisible(f.id)) {
                          <button type="button" (click)="moveField(f.id, -1)" class="w-6 h-6 grid place-items-center rounded hover:bg-background text-text-muted" title="Move up">↑</button>
                          <button type="button" (click)="moveField(f.id, 1)" class="w-6 h-6 grid place-items-center rounded hover:bg-background text-text-muted" title="Move down">↓</button>
                          <button type="button" (click)="toggleLayoutEditor(f.id)"
                            [class]="'w-6 h-6 grid place-items-center rounded text-xs ' + (layoutEditorFieldId() === f.id ? 'bg-primary/20 text-primary' : 'hover:bg-background text-text-muted')"
                            title="Card layout (Large card)">▦</button>
                        }
                      </div>
                      @if (layoutEditorFieldId() === f.id && isFieldVisible(f.id)) {
                        <div class="px-2 pb-2 pt-1.5 mt-0.5 border-t border-border">
                          <p class="uppercase-tag mb-1">Position on card</p>
                          <div class="grid grid-cols-3 gap-0.5 w-[84px] mb-1.5">
                            @for (slot of matrixSlots; track slot) {
                              <button type="button" (click)="setFieldSlot(f.id, slot)"
                                [class]="'h-6 rounded text-[9px] grid place-items-center border transition-colors ' + (layoutOf(f.id).slot === slot ? 'border-primary bg-primary/20 text-primary' : 'border-border text-text-faint hover:bg-background')"
                                [title]="'Anchor: ' + slot">●</button>
                            }
                          </div>
                          <div class="flex gap-1 mb-2">
                            <button type="button" (click)="setFieldSlot(f.id, 'stack')"
                              [class]="'px-2 py-1 rounded text-xs border transition-colors ' + (layoutOf(f.id).slot === 'stack' ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-muted hover:bg-background')"
                              title="Stack above the title (auto-scaled)">Stack ↑ title</button>
                            <button type="button" (click)="setFieldSlot(f.id, 'body')"
                              [class]="'px-2 py-1 rounded text-xs border transition-colors ' + (layoutOf(f.id).slot === 'body' ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-muted hover:bg-background')"
                              title="Default flow under the title">Body</button>
                          </div>
                          <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                            <input type="checkbox" [checked]="layoutOf(f.id).showLabel" (change)="toggleFieldLabel(f.id)" class="accent-primary" />
                            Show "{{ f.name }}:" label
                          </label>
                          @if (f.fieldType === 'DATE') {
                            <select [ngModel]="layoutOf(f.id).dateFormat ?? 'full'" (ngModelChange)="setFieldDateFormat(f.id, $event)"
                              class="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded text-xs outline-none focus:border-primary">
                              <option value="full">Date: full</option>
                              <option value="month">Date: month only (May)</option>
                              <option value="month-year">Date: month + year (May 2026)</option>
                              <option value="year">Date: year only (2026)</option>
                            </select>
                          }
                        </div>
                      }
                    </div>
                  }
                  <div class="flex items-center justify-between gap-2 px-2 pt-2 mt-1 border-t border-border">
                    <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                      <input type="checkbox" [checked]="gridConfig().showImage" (change)="patchGrid({ showImage: !gridConfig().showImage })" class="accent-primary" /> Image
                    </label>
                    <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                      <input type="checkbox" [checked]="gridConfig().showTags" (change)="patchGrid({ showTags: !gridConfig().showTags })" class="accent-primary" /> Tags
                    </label>
                    <button type="button" (click)="fieldsPanelOpen.set(false)" class="text-xs text-primary hover:underline">Done</button>
                  </div>
                </div>
              }
            </div>
          }

          @if ((list()?.fields?.length ?? 0) > 0) {
            <select [ngModel]="viewConfig().groupBy ?? ''" (ngModelChange)="setGroupBy($event || null)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
              <option value="">No grouping</option>
              @for (f of list()!.fields!; track f.id) {
                @if (f.fieldType === 'DATE') {
                  <option [value]="f.id + ':year'">Group by {{ f.name }} · Year</option>
                  <option [value]="f.id + ':month'">Group by {{ f.name }} · Month</option>
                } @else {
                  <option [value]="f.id">Group by {{ f.name }}</option>
                }
              }
            </select>

            <select [ngModel]="viewConfig().sortBy" (ngModelChange)="setSortBy($event)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
              <option value="createdAt">Sort: created</option>
              <option value="title">Sort: title</option>
              @for (f of list()!.fields!; track f.id) {
                <option [value]="f.id">Sort: {{ f.name }}</option>
              }
            </select>

            <button type="button" (click)="toggleSortDir()"
              class="px-3 py-2 bg-surface border border-border rounded text-sm hover:bg-surface-hover">
              {{ viewConfig().sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}
            </button>
          }

          <span class="text-xs text-text-muted ml-auto">{{ filteredItems().length }} items</span>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (filteredItems().length === 0) {
          <div class="text-center py-16 text-text-muted">
            <p class="mb-4">This list has no items yet.</p>
            <button type="button" (click)="openCreateItem()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">
              + Create the first item
            </button>
          </div>
        } @else {
          @for (group of groupedItems(); track group.key) {
            @if (group.label) {
              <h2 class="text-sm font-medium text-text-muted mb-3 mt-4 first:mt-0 border-b border-border pb-1">
                {{ group.label }} <span class="text-xs">({{ group.items.length }})</span>
              </h2>
            }

            @switch (gridConfig().template) {
              @case ('card-large') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                  @for (item of group.items; track item.id) {
                    <div class="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col">
                      <button type="button" (click)="openEditItem(item)" class="text-left">
                        @if (gridConfig().showImage && resolveImage(item); as src) {
                          <img [src]="src" alt="" class="w-full h-40 object-cover" />
                        }
                        <div class="p-3 relative min-h-[3.25rem]">
                          <!-- Fields stacked ABOVE the title (Obsidian header, auto-scaled) -->
                          @for (s of stackEntries(); track s.id) {
                            @if (fieldById(s.id); as f) {
                              <div [class]="s.cls + ' truncate leading-tight'">
                                @if (layoutOf(s.id).showLabel) { <span class="text-text-muted">{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                              </div>
                            }
                          }

                          <h3 class="font-semibold text-lg leading-tight truncate">{{ item.title }}</h3>

                          <!-- Fields in the default body flow -->
                          @for (fieldId of bodyFields(); track fieldId) {
                            @if (fieldById(fieldId); as f) {
                              <p class="text-xs text-text-muted mt-0.5 truncate">
                                @if (layoutOf(fieldId).showLabel) { <strong>{{ f.name }}:</strong> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                              </p>
                            }
                          }

                          @if (gridConfig().showTags && item.tags?.length) {
                            <div class="flex flex-wrap gap-1 mt-2">
                              @for (t of item.tags!; track t.tagId) {
                                @if (tagLookup(t.tagId); as tag) {
                                  <app-tag-chip [label]="tag.name" [color]="tag.color" />
                                }
                              }
                            </div>
                          }

                          <!-- Fields anchored to one of the 9 matrix zones -->
                          @for (a of anchoredFields(); track a.id) {
                            @if (fieldById(a.id); as f) {
                              <span [class]="'card-anchor ' + a.cls">
                                @if (layoutOf(a.id).showLabel) { <span class="opacity-70">{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                              </span>
                            }
                          }
                        </div>
                      </button>
                      @if (actions().length) {
                        <div class="flex flex-wrap gap-1 px-3 pb-3 mt-auto">
                          @for (a of actions(); track a.id) {
                            <button type="button" (click)="runAction(item, a, $event)"
                              class="text-xs px-2 py-1 rounded border border-border hover:border-primary hover:bg-surface-hover transition-colors"
                              [style.color]="a.color || null">
                              {{ a.label }}
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              @case ('card-compact') {
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-6">
                  @for (item of group.items; track item.id) {
                    <button type="button" (click)="openEditItem(item)"
                      class="text-left bg-surface border border-border rounded overflow-hidden hover:border-primary transition-colors">
                      @if (gridConfig().showImage && resolveImage(item); as src) {
                        <img [src]="src" alt="" class="w-full aspect-square object-cover" />
                      }
                      <div class="p-2">
                        <h3 class="text-xs font-medium truncate">{{ item.title }}</h3>
                      </div>
                    </button>
                  }
                </div>
              }

              @case ('card-cover') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                  @for (item of group.items; track item.id) {
                    <button type="button" (click)="openEditItem(item)"
                      class="card-cover text-left"
                      [style.background-image]="resolveImage(item) ? 'url(' + resolveImage(item) + ')' : null">
                      <div class="card-cover-content">
                        <div class="card-cover-top">
                          @if (gridConfig().showTags) {
                            @for (t of item.tags ?? []; track t.tagId) {
                              @if (tagLookup(t.tagId); as tag) {
                                <span class="card-cover-badge" [style.color]="tag.color">{{ tag.name }}</span>
                              }
                            }
                          }
                        </div>
                        <div>
                          @for (fieldId of gridConfig().visibleFields; track fieldId) {
                            @if (fieldById(fieldId); as f) {
                              <div class="card-cover-meta">@if (layoutOf(fieldId).showLabel) { <span>{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}</div>
                            }
                          }
                          <div class="card-cover-title">{{ item.title }}</div>
                        </div>
                      </div>
                    </button>
                  }
                </div>
              }

              @case ('dense-list') {
                <ul class="space-y-1 mb-6">
                  @for (item of group.items; track item.id) {
                    <li>
                      <button type="button" (click)="openEditItem(item)"
                        class="w-full text-left flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded hover:border-primary transition-colors">
                        @if (gridConfig().showImage && resolveImage(item); as src) {
                          <img [src]="src" alt="" class="w-10 h-10 object-cover rounded shrink-0" />
                        }
                        <div class="flex-1 min-w-0">
                          <h3 class="font-medium truncate">{{ item.title }}</h3>
                          @for (fieldId of gridConfig().visibleFields; track fieldId) {
                            @if (fieldById(fieldId); as f) {
                              <span class="text-xs text-text-muted mr-2">
                                @if (layoutOf(fieldId).showLabel) { <strong>{{ f.name }}:</strong> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                              </span>
                            }
                          }
                        </div>
                        @if (gridConfig().showTags) {
                          <div class="flex gap-1">
                            @for (t of item.tags ?? []; track t.tagId) {
                              @if (tagLookup(t.tagId); as tag) {
                                <app-tag-chip [label]="tag.name" [color]="tag.color" />
                              }
                            }
                          </div>
                        }
                      </button>
                    </li>
                  }
                </ul>
              }

              @case ('gallery-no-image') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  @for (item of group.items; track item.id) {
                    <button type="button" (click)="openEditItem(item)"
                      class="text-left p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors">
                      <h3 class="font-semibold mb-1">{{ item.title }}</h3>
                      @for (fieldId of gridConfig().visibleFields; track fieldId) {
                        @if (fieldById(fieldId); as f) {
                          <p class="text-sm text-text-muted">
                            @if (layoutOf(fieldId).showLabel) { <strong>{{ f.name }}:</strong> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                          </p>
                        }
                      }
                      @if (gridConfig().showTags && item.tags?.length) {
                        <div class="flex flex-wrap gap-1 mt-2">
                          @for (t of item.tags!; track t.tagId) {
                            @if (tagLookup(t.tagId); as tag) {
                              <app-tag-chip [label]="tag.name" [color]="tag.color" />
                            }
                          }
                        </div>
                      }
                    </button>
                  }
                </div>
              }

              @case ('table') {
                <div class="overflow-x-auto border border-border rounded mb-6">
                  <table class="w-full text-sm">
                    <thead class="bg-surface text-text-muted text-xs uppercase">
                      <tr>
                        <th class="px-3 py-2 text-left">Title</th>
                        @for (f of list()?.fields ?? []; track f.id) {
                          <th class="px-3 py-2 text-left">{{ f.name }}</th>
                        }
                        @if (gridConfig().showTags) {
                          <th class="px-3 py-2 text-left">Tags</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of group.items; track item.id) {
                        <tr (click)="openEditItem(item)"
                          class="border-t border-border hover:bg-surface-hover cursor-pointer">
                          <td class="px-3 py-2 font-medium">{{ item.title }}</td>
                          @for (f of list()?.fields ?? []; track f.id) {
                            <td class="px-3 py-2 text-text-muted">
                              @if (f.fieldType === 'IMAGE_URL' && item.customFields[f.id]) {
                                <img [src]="resolveImageUrl(item.customFields[f.id])" alt="" class="w-10 h-10 object-cover rounded" />
                              } @else {
                                {{ formatField(item.customFields[f.id]) }}
                              }
                            </td>
                          }
                          @if (gridConfig().showTags) {
                            <td class="px-3 py-2">
                              <div class="flex flex-wrap gap-1">
                                @for (t of item.tags ?? []; track t.tagId) {
                                  @if (tagLookup(t.tagId); as tag) {
                                    <app-tag-chip [label]="tag.name" [color]="tag.color" />
                                  }
                                }
                              </div>
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Fields anchored to the 3×3 matrix on the Large card */
    .card-anchor {
      position: absolute;
      z-index: 10;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1;
      color: var(--color-text-muted);
      background: color-mix(in srgb, var(--color-surface) 85%, transparent);
      padding: 2px 6px;
      border-radius: 6px;
      pointer-events: none;
      max-width: 72%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class ListDetailComponent implements OnInit {
  private readonly service = inject(ListsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly uploads = inject(UploadsService);
  private readonly favoritesStore = inject(FavoritesStore);

  protected isFavorite(listId: string): boolean {
    return this.favoritesStore.isFavorite('LIST', listId);
  }

  protected toggleFavorite(listId: string): void {
    this.favoritesStore.toggle('LIST', listId);
  }

  @Input({ required: true }) id!: string;

  protected readonly loading = signal(true);
  protected readonly list = signal<List | null>(null);
  protected readonly rawItems = signal<ListItem[]>([]);
  protected readonly fieldsPanelOpen = signal(false);
  /** Which field's per-card layout editor (3×3 matrix) is expanded, if any. */
  protected readonly layoutEditorFieldId = signal<string | null>(null);
  protected readonly matrixSlots = CARD_MATRIX_SLOTS;
  protected search = '';

  /** All fields ordered so the currently-visible ones (in their saved order) come first. */
  protected readonly fieldConfigRows = computed<ListField[]>(() => {
    const fields = this.list()?.fields ?? [];
    const visible = this.gridConfig().visibleFields;
    const byId = new Map(fields.map((f) => [f.id, f]));
    const ordered = visible.map((id) => byId.get(id)).filter((f): f is ListField => !!f);
    const rest = fields.filter((f) => !visible.includes(f.id));
    return [...ordered, ...rest];
  });

  protected readonly actions = computed<ListAction[]>(() => this.viewConfig().actions ?? []);

  /** Applies an action's field=value to the item, then refreshes. */
  protected runAction(item: ListItem, action: ListAction, event: Event): void {
    event.stopPropagation();
    const customFields = { ...item.customFields, [action.fieldId]: action.value };
    this.service.updateItem(this.id, item.id, { customFields }).subscribe({
      next: () => {
        this.rawItems.update((arr) =>
          arr.map((it) => (it.id === item.id ? { ...it, customFields } : it)),
        );
        this.toastr.success(`${item.title} → ${action.value}`);
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected isFieldVisible(fieldId: string): boolean {
    return this.gridConfig().visibleFields.includes(fieldId);
  }

  protected toggleFieldVisible(fieldId: string): void {
    const visible = this.gridConfig().visibleFields;
    const next = visible.includes(fieldId)
      ? visible.filter((id) => id !== fieldId)
      : [...visible, fieldId];
    this.patchGridConfig({ visibleFields: next });
  }

  protected moveField(fieldId: string, delta: number): void {
    const visible = [...this.gridConfig().visibleFields];
    const i = visible.indexOf(fieldId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= visible.length) return;
    [visible[i], visible[j]] = [visible[j], visible[i]];
    this.patchGridConfig({ visibleFields: visible });
  }

  protected patchGrid(patch: Partial<GridConfig>): void {
    this.patchGridConfig(patch);
  }

  // ─── Per-field card layout (Large card designer) ─────────
  protected layoutOf(fieldId: string): FieldCardLayout {
    return this.gridConfig().cardLayout?.[fieldId] ?? DEFAULT_FIELD_LAYOUT;
  }

  protected toggleLayoutEditor(fieldId: string): void {
    this.layoutEditorFieldId.update((cur) => (cur === fieldId ? null : fieldId));
  }

  protected setFieldSlot(fieldId: string, slot: CardSlot): void {
    this.patchFieldLayout(fieldId, { slot });
  }

  protected toggleFieldLabel(fieldId: string): void {
    this.patchFieldLayout(fieldId, { showLabel: !this.layoutOf(fieldId).showLabel });
  }

  protected setFieldDateFormat(fieldId: string, fmt: DateDisplayFormat): void {
    this.patchFieldLayout(fieldId, { dateFormat: fmt });
  }

  private patchFieldLayout(fieldId: string, patch: Partial<FieldCardLayout>): void {
    const current = this.gridConfig().cardLayout ?? {};
    const next: Record<string, FieldCardLayout> = {
      ...current,
      [fieldId]: { ...this.layoutOf(fieldId), ...patch },
    };
    this.patchGridConfig({ cardLayout: next });
  }

  /** Visible 'stack' fields ordered top→bottom, each with its size class. */
  protected readonly stackEntries = computed<{ id: string; cls: string }[]>(() => {
    const stack = this.gridConfig().visibleFields.filter(
      (id) => this.layoutOf(id).slot === 'stack',
    );
    // stack[0] sits closest to the title (largest); fields higher up shrink.
    return stack.map((id, i) => ({ id, cls: this.stackTierClass(i) })).reverse();
  });

  protected readonly bodyFields = computed<string[]>(() =>
    this.gridConfig().visibleFields.filter((id) => this.layoutOf(id).slot === 'body'),
  );

  protected readonly anchoredFields = computed<{ id: string; cls: string }[]>(() => {
    const matrix = new Set<CardSlot>(CARD_MATRIX_SLOTS);
    return this.gridConfig()
      .visibleFields.filter((id) => matrix.has(this.layoutOf(id).slot))
      .map((id) => ({ id, cls: this.anchorClass(this.layoutOf(id).slot) }));
  });

  private stackTierClass(indexFromTitle: number): string {
    if (indexFromTitle === 0) return 'text-base font-medium text-text';
    if (indexFromTitle === 1) return 'text-sm text-text-muted';
    return 'text-xs text-text-faint';
  }

  private anchorClass(slot: CardSlot): string {
    switch (slot) {
      case 'tl': return 'top-2 left-2';
      case 'tc': return 'top-2 left-1/2 -translate-x-1/2';
      case 'tr': return 'top-2 right-2';
      case 'ml': return 'top-1/2 left-2 -translate-y-1/2';
      case 'mc': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'mr': return 'top-1/2 right-2 -translate-y-1/2';
      case 'bl': return 'bottom-2 left-2';
      case 'bc': return 'bottom-2 left-1/2 -translate-x-1/2';
      case 'br': return 'bottom-2 right-2';
      default: return '';
    }
  }

  protected formatFieldFor(field: ListField, value: unknown): string {
    const layout = this.layoutOf(field.id);
    if (
      field.fieldType === 'DATE' &&
      layout.dateFormat &&
      layout.dateFormat !== 'full' &&
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const d = new Date(String(value));
      if (!isNaN(d.getTime())) {
        if (layout.dateFormat === 'year') return String(d.getFullYear());
        if (layout.dateFormat === 'month') return d.toLocaleDateString('en-US', { month: 'short' });
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }
    return this.formatField(value);
  }

  protected readonly gridConfig = computed<GridConfig>(() => {
    const l = this.list();
    return l ? resolveGridConfig(l) : {
      template: 'card-large', visibleFields: [], showImage: true, imagePosition: 'top', showTags: true,
    };
  });

  protected readonly viewConfig = computed<ViewConfig>(() => {
    const l = this.list();
    return l ? resolveViewConfig(l) : {
      groupBy: null, sortBy: 'createdAt', sortDir: 'desc', filters: [],
    };
  });

  protected readonly imageField = computed<ListField | null>(() => {
    const l = this.list();
    return l ? findImageField(l) : null;
  });

  protected readonly tagMap = computed(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const t of this.list()?.tags ?? []) map.set(t.id, { name: t.name, color: t.color });
    return map;
  });

  protected readonly fieldMap = computed(() => {
    const map = new Map<string, ListField>();
    for (const f of this.list()?.fields ?? []) map.set(f.id, f);
    return map;
  });

  protected readonly filteredItems = computed<ListItem[]>(() => {
    const q = this.search.trim().toLowerCase();
    return this.rawItems().filter((item) => {
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  protected readonly groupedItems = computed<ItemGroup[]>(() => {
    const config = this.viewConfig();
    const items = this.applySort(this.filteredItems(), config);

    if (!config.groupBy) {
      return [{ key: '__all__', label: '', items }];
    }

    // groupBy is either a fieldId, or "fieldId:year" / "fieldId:month" for dates.
    const [fieldId, granularity] = config.groupBy.split(':') as [string, 'year' | 'month' | undefined];

    const groups = new Map<string, ListItem[]>();
    const labels = new Map<string, string>();
    for (const item of items) {
      const raw = item.customFields[fieldId];
      const { key, label } = this.groupKey(raw, granularity);
      labels.set(key, label);
      const arr = groups.get(key) ?? [];
      arr.push(item);
      groups.set(key, arr);
    }

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      return b.localeCompare(a);
    });

    return sortedKeys.map((k) => ({
      key: k,
      label: k === '__none__' ? 'Unclassified' : labels.get(k) ?? k,
      items: groups.get(k)!,
    }));
  });

  /**
   * Computes the group key + display label for a value. For date fields with a
   * year/month granularity, the key is sortable ("2026" / "2026-05") while the
   * label is human ("2026" / "May 2026") — so the per-day uniqueness problem
   * (one item per date) collapses into useful year/month buckets.
   */
  private groupKey(
    raw: unknown,
    granularity: 'year' | 'month' | undefined,
  ): { key: string; label: string } {
    if (raw === null || raw === undefined || raw === '') {
      return { key: '__none__', label: 'Unclassified' };
    }
    if (granularity) {
      const d = new Date(String(raw));
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        if (granularity === 'year') return { key: String(year), label: String(year) };
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return { key: `${year}-${month}`, label };
      }
    }
    return { key: String(raw), label: String(raw) };
  }

  ngOnInit(): void {
    this.loadList();
  }

  protected fieldById(id: string): ListField | undefined {
    return this.fieldMap().get(id);
  }

  protected tagLookup(id: string): { name: string; color: string } | undefined {
    return this.tagMap().get(id);
  }

  protected formatField(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  protected resolveImage(item: ListItem): string | null {
    const field = this.imageField();
    if (!field) return null;
    const raw = item.customFields[field.id];
    if (typeof raw !== 'string' || !raw) return null;
    return this.uploads.resolveUrl(raw);
  }

  protected resolveImageUrl(value: unknown): string | null {
    return typeof value === 'string' ? this.uploads.resolveUrl(value) : null;
  }

  protected reload(): void {
    this.service.listItems(this.id, { q: this.search || undefined }).subscribe({
      next: (items) => this.rawItems.set(items),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected setTemplate(template: GridTemplate): void {
    this.patchGridConfig({ template });
  }

  protected setGroupBy(groupBy: string | null): void {
    this.patchViewConfig({ groupBy });
  }

  protected setSortBy(sortBy: string): void {
    this.patchViewConfig({ sortBy });
  }

  protected toggleSortDir(): void {
    const current = this.viewConfig().sortDir;
    this.patchViewConfig({ sortDir: current === 'asc' ? 'desc' : 'asc' });
  }

  private patchGridConfig(patch: Partial<GridConfig>): void {
    const current = this.gridConfig();
    const next = { ...current, ...patch };
    const list = this.list();
    if (!list) return;
    this.list.set({ ...list, gridConfig: next });
    this.service.update(this.id, { gridConfig: next }).subscribe({
      error: () => this.toastr.error('Could not save the settings'),
    });
  }

  private patchViewConfig(patch: Partial<ViewConfig>): void {
    const current = this.viewConfig();
    const next = { ...current, ...patch };
    const list = this.list();
    if (!list) return;
    this.list.set({ ...list, viewConfig: next });
    this.service.update(this.id, { viewConfig: next }).subscribe({
      error: () => this.toastr.error('Could not save the settings'),
    });
  }

  private applySort(items: ListItem[], config: ViewConfig): ListItem[] {
    const sorted = [...items];
    const dir = config.sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let va: unknown;
      let vb: unknown;
      if (config.sortBy === 'title') {
        va = a.title;
        vb = b.title;
      } else if (config.sortBy === 'createdAt') {
        va = a.createdAt;
        vb = b.createdAt;
      } else {
        va = a.customFields[config.sortBy];
        vb = b.customFields[config.sortBy];
      }

      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return sorted;
  }

  private loadList(): void {
    this.loading.set(true);
    this.service.findById(this.id).subscribe({
      next: (list) => {
        this.list.set(list);
        this.reload();
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
        void this.router.navigate(['/app/lists']);
      },
    });
  }

  protected openCreateItem(): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListItemDialogComponent, ListItemDialogData, ListItemDialogResult>(
      ListItemDialogComponent,
      { data: { list }, width: 'min(620px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((item) => {
      if (item !== undefined) this.reload();
    });
  }

  protected openEditItem(item: ListItem): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListItemDialogComponent, ListItemDialogData, ListItemDialogResult>(
      ListItemDialogComponent,
      { data: { list, item }, width: 'min(620px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe(() => this.reload());
  }

  protected openSettings(): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListSettingsComponent, ListSettingsData, 'changed' | 'deleted' | undefined>(
      ListSettingsComponent,
      { data: { list }, width: 'min(680px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result === 'deleted') {
        void this.router.navigate(['/app/lists']);
      } else if (result === 'changed') {
        this.loadList();
      }
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
