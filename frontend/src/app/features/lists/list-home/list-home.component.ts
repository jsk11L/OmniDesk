import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListsService } from '../services/lists.service';
import { ImageCellComponent } from '../../../shared/components/image-cell/image-cell.component';
import {
  CreateListDialogComponent,
  type CreateListDialogResult,
} from '../create-list-dialog/create-list-dialog.component';
import {
  ObsidianImportDialogComponent,
  type ObsidianImportDialogData,
} from '../obsidian-import-dialog/obsidian-import-dialog.component';
import {
  ListPresetDialogComponent,
  type ListPresetDialogResult,
} from '../list-preset-dialog/list-preset-dialog.component';
import { DEFAULT_CARD_STYLE, type FieldCardLayout, type GridConfig, type List, type ObsidianImportConfig } from '../lists.types';
import type { ListPreset } from '../list-presets';

@Component({
  selector: 'app-list-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ImageCellComponent, MatDialogModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-4 sm:px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">Lists</h1>
          <p class="text-sm text-text-muted">
            Custom libraries with fields and images per item
          </p>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="search"
            [(ngModel)]="search"
            placeholder="Search lists…"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary w-64"
          />
          <input #jsonInput type="file" accept=".json,application/json" class="hidden" (change)="onJsonPicked($event)" />
          <button
            type="button"
            (click)="jsonInput.click()"
            [disabled]="importing()"
            title="Create a complete list from a .json file (fields + items ready)"
            class="px-3 py-2 rounded border border-border text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            ⬆ JSON
          </button>
          <input #vaultInput type="file" accept=".zip" class="hidden" (change)="onVaultPicked($event)" />
          <button
            type="button"
            (click)="vaultInput.click()"
            [disabled]="importing()"
            title="Create a list from an Obsidian vault (.zip) — frontmatter becomes custom fields"
            class="px-3 py-2 rounded border border-border text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            {{ importing() ? 'Importing…' : '⬇ Obsidian' }}
          </button>
          <button
            type="button"
            (click)="openPresets()"
            [disabled]="importing()"
            title="Start from a template (movies, albums, books…)"
            class="px-3 py-2 rounded border border-border text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            ✨ Templates
          </button>
          <button
            type="button"
            (click)="openCreate()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            + New list
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (filtered().length === 0) {
          <div class="text-center py-16 text-text-muted">
            @if (search) {
              <p>No list matches "{{ search }}".</p>
            } @else {
              <p class="mb-4">You don't have any lists yet. Create your first to get started.</p>
              <button
                type="button"
                (click)="openCreate()"
                class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
              >
                + Create list
              </button>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (list of filtered(); track list.id) {
              <a
                [routerLink]="['/app/lists', list.id]"
                class="block bg-surface border border-border rounded overflow-hidden hover:border-primary transition-colors"
              >
                <app-image-cell
                  [src]="list.coverImageUrl"
                  [imgClass]="'w-full h-32 object-cover'"
                  [placeholder]="list.icon ?? '📚'"
                />
                <div class="p-4">
                  <h2 class="font-semibold mb-1 flex items-center gap-2">
                    @if (list.icon) {
                      <span>{{ list.icon }}</span>
                    }
                    {{ list.name }}
                  </h2>
                  @if (list.description) {
                    <p class="text-xs text-text-muted line-clamp-2">{{ list.description }}</p>
                  }
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ListHomeComponent implements OnInit {
  private readonly service = inject(ListsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly lists = signal<List[]>([]);
  protected readonly importing = signal(false);
  protected search = '';

  protected readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    const all = this.lists();
    if (!q) return all;
    return all.filter((l) => l.name.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected onJsonPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.importing.set(true);
    this.service.importListJson(file).subscribe({
      next: (report) => {
        this.importing.set(false);
        this.toastr.success(`Created "${report.listName}" · ${report.itemsCreated} items`);
        void this.router.navigate(['/app/lists', report.listId]);
      },
      error: (err: HttpErrorResponse) => {
        this.importing.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected onVaultPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    // Step 1 — analyze (dry run) so the user can reconfigure fields first.
    this.importing.set(true);
    this.service.analyzeObsidian(file).subscribe({
      next: (analysis) => {
        this.importing.set(false);
        const ref = this.dialog.open<
          ObsidianImportDialogComponent,
          ObsidianImportDialogData,
          ObsidianImportConfig | undefined
        >(ObsidianImportDialogComponent, {
          data: { fileName: file.name, analysis },
          width: 'min(760px, 96vw)',
          maxWidth: '96vw',
        });
        ref.afterClosed().subscribe((config) => {
          if (config) this.runImport(file, config);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.importing.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  // Step 2 — import with the confirmed field config.
  private runImport(file: File, config: ObsidianImportConfig): void {
    this.importing.set(true);
    this.service.importObsidian(file, config).subscribe({
      next: (report) => {
        this.importing.set(false);
        this.toastr.success(
          `Imported ${report.itemsCreated} items · ${report.fieldsCreated} fields · ${report.tagsCreated} tags`,
        );
        if (report.errors.length) {
          this.toastr.warning(`${report.errors.length} notes had issues and were skipped`);
        }
        void this.router.navigate(['/app/lists', report.listId]);
      },
      error: (err: HttpErrorResponse) => {
        this.importing.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected openCreate(): void {
    const ref = this.dialog.open<CreateListDialogComponent, void, CreateListDialogResult>(
      CreateListDialogComponent,
    );
    ref.afterClosed().subscribe((result) => {
      if (result) {
        void this.router.navigate(['/app/lists', result.id]);
      }
    });
  }

  protected openPresets(): void {
    this.dialog
      .open<ListPresetDialogComponent, void, ListPresetDialogResult>(ListPresetDialogComponent, {
        width: 'min(680px, 96vw)',
        maxWidth: '96vw',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) void this.createFromPreset(result.preset, result.name);
      });
  }

  /**
   * Creates a list from a preset: the list, its fields, then a gridConfig that
   * wires the freshly-created field ids into visibleFields + per-field layout.
   */
  private async createFromPreset(preset: ListPreset, name: string): Promise<void> {
    this.importing.set(true);
    try {
      const list = await firstValueFrom(this.service.create({ name, icon: preset.listIcon }));

      const nameToId: Record<string, string> = {};
      for (const f of preset.fields) {
        const created = await firstValueFrom(
          this.service.createField(list.id, {
            name: f.name,
            fieldType: f.type,
            options: f.options ? { options: f.options } : undefined,
          }),
        );
        nameToId[f.name] = created.id;
      }

      const onCard = preset.fields.filter((f) => f.onCard);
      const visibleFields = onCard.map((f) => nameToId[f.name]).filter((id): id is string => !!id);
      const cardLayout: Record<string, FieldCardLayout> = {};
      for (const f of onCard) {
        const id = nameToId[f.name];
        if (!id) continue;
        cardLayout[id] = {
          slot: f.slot ?? 'body',
          showLabel: f.showLabel ?? false,
          level: f.level,
          dateFormat: f.dateFormat,
        };
      }

      const gridConfig: Partial<GridConfig> = {
        template: preset.template,
        visibleFields,
        showImage: preset.showImage,
        imagePosition: 'top',
        showTags: preset.showTags,
        cardLayout,
        cardStyle: preset.cardStyle ?? DEFAULT_CARD_STYLE,
      };
      await firstValueFrom(this.service.update(list.id, { gridConfig }));

      this.toastr.success(`Created "${name}"`);
      void this.router.navigate(['/app/lists', list.id]);
    } catch (err) {
      this.toastr.error(this.errMsg(err as HttpErrorResponse));
    } finally {
      this.importing.set(false);
    }
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
