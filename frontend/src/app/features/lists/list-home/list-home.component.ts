import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { ImageCellComponent } from '../../../shared/components/image-cell/image-cell.component';
import {
  CreateListDialogComponent,
  type CreateListDialogResult,
} from '../create-list-dialog/create-list-dialog.component';
import type { List } from '../lists.types';

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

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
