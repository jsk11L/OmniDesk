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
import { ImageCellComponent } from '../../../shared/components/image-cell/image-cell.component';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import {
  ViewSwitcherComponent,
  type ListViewType,
} from '../../../shared/components/view-switcher/view-switcher.component';
import {
  ListItemDialogComponent,
  type ListItemDialogData,
  type ListItemDialogResult,
} from '../list-item-dialog/list-item-dialog.component';
import {
  ListSettingsComponent,
  type ListSettingsData,
} from '../list-settings/list-settings.component';
import type { List, ListItem } from '../lists.types';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatDialogModule,
    ImageCellComponent,
    TagChipComponent,
    ViewSwitcherComponent,
  ],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <div class="flex items-center justify-between gap-4 mb-3">
          <div class="flex items-center gap-3">
            <a routerLink="/lists" class="text-text-muted hover:text-text text-sm">← Listas</a>
            <h1 class="text-2xl font-semibold flex items-center gap-2">
              @if (list()?.icon) {
                <span>{{ list()!.icon }}</span>
              }
              {{ list()?.name ?? '…' }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="openSettings()"
              class="px-3 py-2 rounded text-sm hover:bg-surface-hover"
            >
              ⚙ Ajustes
            </button>
            <button
              type="button"
              (click)="openCreateItem()"
              [disabled]="!list()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              + Nuevo ítem
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="reload()"
            placeholder="Buscar…"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary w-64"
          />
          @if ((list()?.tags?.length ?? 0) > 0) {
            <select
              [(ngModel)]="tagFilter"
              (ngModelChange)="reload()"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
            >
              <option value="">Todos los tags</option>
              @for (t of list()!.tags!; track t.id) {
                <option [value]="t.name">{{ t.name }}</option>
              }
            </select>
          }
          <app-view-switcher [value]="view()" (viewChange)="setView($event)" />
          <span class="text-xs text-text-muted">{{ items().length }} ítems</span>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        @if (loading()) {
          <p class="text-text-muted">Cargando…</p>
        } @else if (items().length === 0) {
          <div class="text-center py-16 text-text-muted">
            <p class="mb-4">Esta lista aún no tiene ítems.</p>
            <button
              type="button"
              (click)="openCreateItem()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
            >
              + Crear el primer ítem
            </button>
          </div>
        } @else {
          @switch (view()) {
            @case ('GRID') {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                @for (item of items(); track item.id) {
                  <button
                    type="button"
                    (click)="openEditItem(item)"
                    class="text-left bg-surface border border-border rounded overflow-hidden hover:border-primary transition-colors"
                  >
                    <app-image-cell
                      [src]="item.imageUrl"
                      [imgClass]="'w-full h-40 object-cover'"
                      placeholder="—"
                    />
                    <div class="p-3">
                      <h3 class="font-medium truncate">{{ item.title }}</h3>
                      @if (item.tags?.length) {
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

            @case ('TABLE') {
              <div class="overflow-x-auto border border-border rounded">
                <table class="w-full text-sm">
                  <thead class="bg-surface text-text-muted text-xs uppercase">
                    <tr>
                      <th class="px-3 py-2 text-left">Imagen</th>
                      <th class="px-3 py-2 text-left">Título</th>
                      @for (f of list()?.fields ?? []; track f.id) {
                        <th class="px-3 py-2 text-left">{{ f.name }}</th>
                      }
                      <th class="px-3 py-2 text-left">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of items(); track item.id) {
                      <tr
                        (click)="openEditItem(item)"
                        class="border-t border-border hover:bg-surface-hover cursor-pointer"
                      >
                        <td class="px-3 py-2">
                          <app-image-cell [src]="item.imageUrl" />
                        </td>
                        <td class="px-3 py-2 font-medium">{{ item.title }}</td>
                        @for (f of list()?.fields ?? []; track f.id) {
                          <td class="px-3 py-2 text-text-muted">
                            {{ formatField(item.customFields[f.id]) }}
                          </td>
                        }
                        <td class="px-3 py-2">
                          <div class="flex flex-wrap gap-1">
                            @for (t of item.tags ?? []; track t.tagId) {
                              @if (tagLookup(t.tagId); as tag) {
                                <app-tag-chip [label]="tag.name" [color]="tag.color" />
                              }
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @case ('GALLERY') {
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                @for (item of items(); track item.id) {
                  <button
                    type="button"
                    (click)="openEditItem(item)"
                    class="relative aspect-[3/4] bg-surface rounded overflow-hidden border border-border hover:border-primary transition-colors group"
                  >
                    <app-image-cell
                      [src]="item.imageUrl"
                      [imgClass]="'w-full h-full object-cover'"
                      placeholder="—"
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3"
                    >
                      <p class="text-white text-sm font-medium drop-shadow line-clamp-2">
                        {{ item.title }}
                      </p>
                    </div>
                  </button>
                }
              </div>
            }

            @case ('LIST') {
              <ul class="space-y-1">
                @for (item of items(); track item.id) {
                  <li>
                    <button
                      type="button"
                      (click)="openEditItem(item)"
                      class="w-full text-left flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded hover:border-primary transition-colors"
                    >
                      <app-image-cell [src]="item.imageUrl" />
                      <div class="flex-1 min-w-0">
                        <h3 class="font-medium truncate">{{ item.title }}</h3>
                        @if (item.tags?.length) {
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for (t of item.tags!; track t.tagId) {
                              @if (tagLookup(t.tagId); as tag) {
                                <app-tag-chip [label]="tag.name" [color]="tag.color" />
                              }
                            }
                          </div>
                        }
                      </div>
                    </button>
                  </li>
                }
              </ul>
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

  @Input({ required: true }) id!: string;

  protected readonly loading = signal(true);
  protected readonly list = signal<List | null>(null);
  protected readonly items = signal<ListItem[]>([]);
  protected readonly view = signal<ListViewType>('GRID');
  protected search = '';
  protected tagFilter = '';

  protected readonly tagMap = computed(() => {
    const map = new Map<string, { name: string; color: string }>();
    const tags = this.list()?.tags ?? [];
    for (const t of tags) map.set(t.id, { name: t.name, color: t.color });
    return map;
  });

  ngOnInit(): void {
    this.loadList();
  }

  setView(view: ListViewType): void {
    this.view.set(view);
  }

  tagLookup(id: string): { name: string; color: string } | undefined {
    return this.tagMap().get(id);
  }

  formatField(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return String(value);
  }

  reload(): void {
    this.service
      .listItems(this.id, { q: this.search || undefined, tag: this.tagFilter || undefined })
      .subscribe({
        next: (items) => this.items.set(items),
        error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
      });
  }

  private loadList(): void {
    this.loading.set(true);
    this.service.findById(this.id).subscribe({
      next: (list) => {
        this.list.set(list);
        this.view.set(list.defaultView);
        this.reload();
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
        void this.router.navigate(['/lists']);
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
        void this.router.navigate(['/lists']);
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
    return 'Error inesperado';
  }
}
