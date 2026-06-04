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
  type GridConfig,
  type List,
  type ListField,
  type ListItem,
  type ViewConfig,
  type GridTemplate,
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
            <select [ngModel]="viewConfig().groupBy ?? ''" (ngModelChange)="setGroupBy($event || null)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
              <option value="">No grouping</option>
              @for (f of list()!.fields!; track f.id) {
                <option [value]="f.id">Group by {{ f.name }}</option>
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
                    <button type="button" (click)="openEditItem(item)"
                      class="text-left bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
                      @if (gridConfig().showImage && resolveImage(item); as src) {
                        <img [src]="src" alt="" class="w-full h-40 object-cover" />
                      }
                      <div class="p-3">
                        <h3 class="font-medium truncate">{{ item.title }}</h3>
                        @for (fieldId of gridConfig().visibleFields; track fieldId) {
                          @if (fieldById(fieldId); as f) {
                            <p class="text-xs text-text-muted mt-0.5">
                              <strong>{{ f.name }}:</strong> {{ formatField(item.customFields[f.id]) }}
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
                      </div>
                    </button>
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
                              <div class="card-cover-meta">{{ f.name }}: {{ formatField(item.customFields[f.id]) }}</div>
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
                                {{ f.name }}: {{ formatField(item.customFields[f.id]) }}
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
                            <strong>{{ f.name }}:</strong> {{ formatField(item.customFields[f.id]) }}
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
})
export class ListDetailComponent implements OnInit {
  private readonly service = inject(ListsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly uploads = inject(UploadsService);

  @Input({ required: true }) id!: string;

  protected readonly loading = signal(true);
  protected readonly list = signal<List | null>(null);
  protected readonly rawItems = signal<ListItem[]>([]);
  protected search = '';

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

    const groups = new Map<string, ListItem[]>();
    for (const item of items) {
      const raw = item.customFields[config.groupBy];
      const key = raw === null || raw === undefined || raw === '' ? '__none__' : String(raw);
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
      label: k === '__none__' ? 'Unclassified' : k,
      items: groups.get(k)!,
    }));
  });

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
      { data: { list } },
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
      { data: { list, item } },
    );
    ref.afterClosed().subscribe(() => this.reload());
  }

  protected openSettings(): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListSettingsComponent, ListSettingsData, 'changed' | 'deleted' | undefined>(
      ListSettingsComponent,
      { data: { list } },
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
