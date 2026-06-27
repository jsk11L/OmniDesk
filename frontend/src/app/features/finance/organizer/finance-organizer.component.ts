import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { FinanceService } from '../services/finance.service';
import { OrganizerService } from '../services/organizer.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { UploadsService } from '../../../shared/services/uploads.service';
import { WishlistDialogComponent, type WishlistDialogData } from './wishlist-dialog.component';
import {
  PlannedPurchaseDialogComponent,
  type PlannedPurchaseDialogData,
} from './planned-purchase-dialog.component';
import {
  SavingsGoalDialogComponent,
  type SavingsGoalDialogData,
} from './savings-goal-dialog.component';
import type {
  FinanceBoard,
  PlannedPurchase,
  SavingsGoal,
  WishlistItem,
} from '../finance.types';

type Tab = 'wishlist' | 'planned' | 'savings';

@Component({
  selector: 'app-finance-organizer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, RouterLink, RouterLinkActive, MatDialogModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-4 sm:px-6 pt-4 flex items-center justify-between gap-4">
        <h1 class="text-xl sm:text-2xl font-semibold">Finance</h1>
        <button type="button" [disabled]="!board()" (click)="add()" class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">+ New</button>
      </header>

      <nav class="px-4 sm:px-6 flex gap-1 border-b border-border">
        <a routerLink="/app/finance/organizer" routerLinkActive="!border-primary !text-text font-medium"
          class="px-3 py-2.5 -mb-px text-sm border-b-2 border-transparent text-text-muted hover:text-text">
          Wishlist &amp; Savings
        </a>
        <a routerLink="/app/finance" routerLinkActive="!border-primary !text-text font-medium"
          [routerLinkActiveOptions]="{ exact: true }"
          class="px-3 py-2.5 -mb-px text-sm border-b-2 border-transparent text-text-muted hover:text-text">
          Expenses &amp; Budgets
        </a>
      </nav>

      <nav class="px-4 sm:px-6 pt-3 flex gap-2 border-b border-border">
        @for (t of tabs; track t.id) {
          <button type="button" (click)="tab.set(t.id)"
            [class]="'px-3 py-2 text-sm rounded-t border-b-2 ' + (tab() === t.id ? 'border-primary text-text' : 'border-transparent text-text-muted hover:text-text')">
            {{ t.label }}
          </button>
        }
      </nav>

      <div class="flex-1 overflow-auto p-6">
        @if (!board()) {
          <p class="text-text-muted">Loading…</p>
        } @else {
          <!-- Wishlist & Savings mini-dashboard (design handoff) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div class="bg-surface border border-border-soft rounded-lg p-4">
              <div class="uppercase-tag mb-1.5">Wishlist value</div>
              <div class="mono text-2xl font-semibold tracking-tight" style="color: var(--color-primary)">{{ money(wishlistValue()) }}</div>
              <div class="text-xs text-text-muted mono mt-1">⭐ {{ pendingCount() }} pending {{ pendingCount() === 1 ? 'item' : 'items' }}</div>
            </div>
            <div class="bg-surface border border-border-soft rounded-lg p-4" style="border-left: 3px solid var(--color-success)">
              <div class="uppercase-tag mb-1.5">Saved in goals</div>
              <div class="mono text-2xl font-semibold tracking-tight" style="color: var(--color-success)">{{ money(totalSaved()) }}</div>
              <div class="text-xs text-text-muted mono mt-1">📈 {{ savedPct() }}% of target · {{ activeGoals() }} active</div>
            </div>
            <div class="bg-surface border border-border-soft rounded-lg p-4">
              <div class="uppercase-tag mb-1.5">Left to save</div>
              <div class="mono text-2xl font-semibold tracking-tight" style="color: var(--color-accent)">{{ money(leftToSave()) }}</div>
              <div class="text-xs text-text-muted mono mt-1">⏳ across {{ goals().length }} {{ goals().length === 1 ? 'goal' : 'goals' }}</div>
            </div>
          </div>

          @switch (tab()) {
            @case ('wishlist') {
              <div class="flex items-center gap-2 mb-3 text-sm">
                <label class="flex items-center gap-1 text-text-muted cursor-pointer">
                  <input type="checkbox" [(ngModel)]="showArchived" class="accent-primary" /> Show archived
                </label>
              </div>
              @if (visibleWishlist().length === 0) {
                <p class="text-text-muted text-sm">No wishes yet.</p>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (w of visibleWishlist(); track w.id) {
                    <div class="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors" [class.opacity-60]="w.isArchived">
                      @if (resolveImg(w.imageUrl); as src) { <img [src]="src" alt="" class="w-full h-32 object-cover" /> }
                      <div class="p-3">
                        <div class="flex items-start justify-between gap-2">
                          <button type="button" (click)="editWishlist(w)" class="font-medium text-left hover:text-primary">{{ w.title }}</button>
                          <span class="text-xs px-1.5 py-0.5 rounded shrink-0" [class]="priorityClass(w.priority)">{{ w.priority }}</span>
                        </div>
                        @if (w.estimatedPrice != null) { <p class="text-sm text-text-muted mt-1">{{ money(w.estimatedPrice) }}</p> }
                        <div class="flex items-center gap-3 mt-2 text-xs">
                          @if (w.url) { <a [href]="w.url" target="_blank" rel="noopener" class="text-primary hover:underline">Open link</a> }
                          <button type="button" (click)="toggleArchive(w)" class="text-text-muted hover:text-text">{{ w.isArchived ? 'Unarchive' : 'Archive' }}</button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
            @case ('planned') {
              @if (planned().length === 0) {
                <p class="text-text-muted text-sm">No planned purchases yet.</p>
              } @else {
                <div class="space-y-2">
                  @for (p of planned(); track p.id) {
                    <div class="bg-surface border border-border rounded p-3 flex items-center justify-between gap-3" [class.opacity-60]="p.isPurchased">
                      <button type="button" (click)="editPlanned(p)" class="text-left flex-1 min-w-0">
                        <span class="font-medium">{{ p.title }}</span>
                        <span class="block text-xs text-text-muted">{{ money(p.amount) }} · target {{ p.targetDate | date: 'd MMM y' }}</span>
                      </button>
                      @if (p.isPurchased) {
                        <span class="text-xs text-success">✓ purchased</span>
                      } @else {
                        <button type="button" (click)="markPurchased(p)" class="text-xs px-2 py-1 rounded border border-border hover:bg-surface-hover whitespace-nowrap">Mark purchased</button>
                      }
                    </div>
                  }
                </div>
              }
            }
            @case ('savings') {
              @if (goals().length === 0) {
                <p class="text-text-muted text-sm">No savings goals yet.</p>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (g of goals(); track g.id) {
                    <div class="bg-surface border border-border rounded-lg p-4" [style.border-top]="'3px solid ' + g.color">
                      <div class="flex items-start justify-between">
                        <button type="button" (click)="editGoal(g)" class="flex items-center gap-2 text-left">
                          @if (g.icon) { <span class="text-xl">{{ g.icon }}</span> }
                          <span class="font-semibold">{{ g.name }}</span>
                        </button>
                        @if (g.isCompleted) { <span class="text-xs text-success">✓</span> }
                      </div>
                      <p class="text-sm text-text-muted mt-1">{{ money(g.currentAmount) }} / {{ money(g.targetAmount) }} ({{ percent(g) }}%)</p>
                      <div class="w-full h-2 bg-background rounded overflow-hidden mt-2">
                        <div class="h-full transition-all" [style.width.%]="percent(g)" [style.background]="g.color"></div>
                      </div>
                      <button type="button" (click)="addContribution(g)" class="mt-3 text-xs text-primary hover:underline">+ Add contribution</button>
                    </div>
                  }
                </div>
              }
            }
          }
        }
      </div>
    </div>
  `,
})
export class FinanceOrganizerComponent implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly organizer = inject(OrganizerService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(DialogService);
  private readonly uploads = inject(UploadsService);
  private readonly toastr = inject(ToastrService);

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'planned', label: 'Planned purchases' },
    { id: 'savings', label: 'Savings goals' },
  ];
  protected readonly tab = signal<Tab>('wishlist');
  protected readonly boards = signal<FinanceBoard[]>([]);
  protected readonly board = signal<FinanceBoard | null>(null);
  protected readonly wishlist = signal<WishlistItem[]>([]);
  protected readonly planned = signal<PlannedPurchase[]>([]);
  protected readonly goals = signal<SavingsGoal[]>([]);
  protected selectedBoardId = '';
  protected showArchived = false;

  protected readonly visibleWishlist = computed(() =>
    this.wishlist().filter((w) => this.showArchived || !w.isArchived),
  );

  // ─── Mini-dashboard stats (design handoff) ───────────────
  /** Pending = wishes still on the list (not archived). */
  private readonly pendingWishlist = computed(() =>
    this.wishlist().filter((w) => !w.isArchived),
  );
  protected readonly pendingCount = computed(() => this.pendingWishlist().length);
  protected readonly wishlistValue = computed(() =>
    this.pendingWishlist().reduce((sum, w) => sum + (w.estimatedPrice ?? 0), 0),
  );
  protected readonly totalSaved = computed(() =>
    this.goals().reduce((sum, g) => sum + g.currentAmount, 0),
  );
  protected readonly totalGoal = computed(() =>
    this.goals().reduce((sum, g) => sum + g.targetAmount, 0),
  );
  protected readonly leftToSave = computed(() =>
    Math.max(0, this.totalGoal() - this.totalSaved()),
  );
  protected readonly savedPct = computed(() => {
    const goal = this.totalGoal();
    return goal > 0 ? Math.round((this.totalSaved() / goal) * 100) : 0;
  });
  protected readonly activeGoals = computed(
    () => this.goals().filter((g) => !g.isCompleted).length,
  );

  ngOnInit(): void {
    this.finance.listBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        const first = boards.find((b) => b.isDefault) ?? boards[0];
        if (first) {
          this.selectedBoardId = first.id;
          this.loadBoard(first.id);
        }
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  protected loadBoard(id: string): void {
    this.finance.findBoard(id).subscribe({ next: (b) => this.board.set(b), error: () => undefined });
    this.organizer.listWishlist(id).subscribe({ next: (w) => this.wishlist.set(w), error: () => undefined });
    this.organizer.listPlanned(id).subscribe({ next: (p) => this.planned.set(p), error: () => undefined });
    this.organizer.listGoals(id).subscribe({ next: (g) => this.goals.set(g), error: () => undefined });
  }

  private reload(): void {
    if (this.selectedBoardId) this.loadBoard(this.selectedBoardId);
  }

  protected money(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.board()?.currency || 'USD',
    }).format(value);
  }

  protected resolveImg(url: string | null): string | null {
    return this.uploads.resolveUrl(url);
  }

  protected percent(g: SavingsGoal): number {
    if (g.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
  }

  protected priorityClass(p: string): string {
    return p === 'HIGH'
      ? 'bg-danger/20 text-danger'
      : p === 'MEDIUM'
        ? 'bg-accent/20 text-accent'
        : 'bg-surface-hover text-text-muted';
  }

  protected add(): void {
    if (this.tab() === 'wishlist') this.editWishlist();
    else if (this.tab() === 'planned') this.editPlanned();
    else this.editGoal();
  }

  protected editWishlist(item?: WishlistItem): void {
    const boardId = this.selectedBoardId;
    if (!boardId) return;
    this.dialog
      .open<WishlistDialogComponent, WishlistDialogData>(WishlistDialogComponent, {
        data: { boardId, item },
        width: 'min(520px, 95vw)',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((r) => r === 'changed' && this.reload());
  }

  protected editPlanned(item?: PlannedPurchase): void {
    const boardId = this.selectedBoardId;
    if (!boardId) return;
    this.dialog
      .open<PlannedPurchaseDialogComponent, PlannedPurchaseDialogData>(PlannedPurchaseDialogComponent, {
        data: { boardId, categories: this.board()?.categories ?? [], item },
        width: 'min(520px, 95vw)',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((r) => r === 'changed' && this.reload());
  }

  protected editGoal(item?: SavingsGoal): void {
    const boardId = this.selectedBoardId;
    if (!boardId) return;
    this.dialog
      .open<SavingsGoalDialogComponent, SavingsGoalDialogData>(SavingsGoalDialogComponent, {
        data: { boardId, item },
        width: 'min(480px, 95vw)',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((r) => r === 'changed' && this.reload());
  }

  protected toggleArchive(w: WishlistItem): void {
    this.organizer.updateWishlist(w.id, { isArchived: !w.isArchived }).subscribe({
      next: () => this.reload(),
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  protected async markPurchased(p: PlannedPurchase): Promise<void> {
    const createTransaction = await this.dialogs.confirm({
      title: 'Mark as purchased',
      message: 'Also create an expense transaction for this amount?',
      confirmLabel: 'Yes, create transaction',
      cancelLabel: 'No, just mark',
    });
    this.organizer.updatePlanned(p.id, { isPurchased: true, createTransaction }).subscribe({
      next: () => {
        this.toastr.success('Marked as purchased');
        this.reload();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  protected async addContribution(g: SavingsGoal): Promise<void> {
    const amountStr = await this.dialogs.prompt({
      title: `Add to "${g.name}"`,
      label: 'Amount',
      inputType: 'number',
      confirmLabel: 'Add',
    });
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.toastr.error('Invalid amount');
      return;
    }
    this.organizer.addContribution(g.id, { amount }).subscribe({
      next: () => {
        this.toastr.success('Contribution added');
        this.reload();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const m = body?.error?.message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
    return 'Something went wrong';
  }
}
