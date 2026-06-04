import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import type { ChartConfiguration, ChartData } from 'chart.js';

import { FinanceService } from '../services/finance.service';
import { DialogService } from '../../../shared/services/dialog.service';
import {
  TransactionDialogComponent,
  type TransactionDialogData,
  type TransactionDialogResult,
} from '../transaction-dialog/transaction-dialog.component';
import type {
  Budget,
  FinanceBoard,
  FinanceSummary,
  Transaction,
} from '../finance.types';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, BaseChartDirective],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
      <header class="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-semibold">Finance</h1>
          @if (boards().length > 0) {
            <select
              [(ngModel)]="selectedBoardId"
              (ngModelChange)="onBoardChange($event)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
            >
              @for (b of boards(); track b.id) {
                <option [value]="b.id">{{ b.name }} ({{ b.currency }})</option>
              }
            </select>
          }
          <input
            type="month"
            [(ngModel)]="selectedMonth"
            (ngModelChange)="reload()"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            (click)="createBoard()"
            class="px-3 py-2 rounded text-sm hover:bg-surface-hover"
          >
            + Board
          </button>
          <button
            type="button"
            (click)="addTransaction()"
            [disabled]="!board()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            + Transaction
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6 space-y-6">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (!board()) {
          <p class="text-text-muted text-center py-16">Create a board to get started.</p>
        } @else if (summary()) {
          @let s = summary()!;
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-surface border border-border rounded p-4">
              <p class="text-xs text-text-muted mb-1">Income</p>
              <p class="text-2xl font-semibold text-success">
                {{ formatCurrency(s.income) }}
              </p>
            </div>
            <div class="bg-surface border border-border rounded p-4">
              <p class="text-xs text-text-muted mb-1">Expenses</p>
              <p class="text-2xl font-semibold text-danger">
                {{ formatCurrency(s.expense) }}
              </p>
            </div>
            <div class="bg-surface border border-border rounded p-4">
              <p class="text-xs text-text-muted mb-1">Balance</p>
              <p
                class="text-2xl font-semibold"
                [class.text-success]="s.balance >= 0"
                [class.text-danger]="s.balance < 0"
              >
                {{ formatCurrency(s.balance) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="bg-surface border border-border rounded p-4">
              <h2 class="text-sm font-medium mb-3">Income vs Expenses per day</h2>
              <div class="h-64">
                <canvas
                  baseChart
                  [data]="lineData()"
                  [options]="lineOptions"
                  [type]="'line'"
                ></canvas>
              </div>
            </div>
            <div class="bg-surface border border-border rounded p-4">
              <h2 class="text-sm font-medium mb-3">Expenses by category</h2>
              <div class="h-64">
                @if (s.byCategory.length > 0) {
                  <canvas
                    baseChart
                    [data]="donutData()"
                    [options]="donutOptions"
                    [type]="'doughnut'"
                  ></canvas>
                } @else {
                  <p class="text-text-muted text-sm text-center py-12">
                    No expenses in the selected period
                  </p>
                }
              </div>
            </div>
          </div>

          <section>
            <h2 class="text-sm font-medium mb-3">Budgets</h2>
            @if ((board()!.budgets ?? []).length === 0) {
              <p class="text-text-muted text-sm">
                You don't have any budgets yet.
                <button (click)="addBudget()" class="text-primary hover:underline">
                  + Create the first one
                </button>
              </p>
            } @else {
              <div class="space-y-2">
                @for (b of board()!.budgets!; track b.id) {
                  <div class="bg-surface border border-border rounded p-3">
                    <div class="flex items-center justify-between text-sm mb-1">
                      <span class="font-medium">{{ b.name }}</span>
                      <span class="text-xs text-text-muted">
                        {{ formatCurrency(budgetSpent(b)) }} / {{ formatCurrency(b.amount) }}
                        ({{ percent(b) }}%)
                      </span>
                    </div>
                    <div class="w-full h-2 bg-background rounded overflow-hidden">
                      <div
                        class="h-full transition-all"
                        [style.width.%]="Math.min(100, percent(b))"
                        [style.background]="percent(b) > 100 ? 'var(--color-danger)' : 'var(--color-primary)'"
                      ></div>
                    </div>
                  </div>
                }
                <button
                  type="button"
                  (click)="addBudget()"
                  class="text-xs text-primary hover:underline"
                >
                  + Add budget
                </button>
              </div>
            }
          </section>

          <section>
            <h2 class="text-sm font-medium mb-3">Recent transactions</h2>
            @if (transactions().length === 0) {
              <p class="text-text-muted text-sm py-8 text-center">No transactions</p>
            } @else {
              <div class="border border-border rounded overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-surface text-text-muted text-xs uppercase">
                    <tr>
                      <th class="px-3 py-2 text-left">Date</th>
                      <th class="px-3 py-2 text-left">Title</th>
                      <th class="px-3 py-2 text-left">Category</th>
                      <th class="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of transactions(); track t.id) {
                      <tr
                        (click)="editTransaction(t)"
                        class="border-t border-border hover:bg-surface-hover cursor-pointer"
                      >
                        <td class="px-3 py-2 text-text-muted">
                          {{ formatDate(t.date) }}
                        </td>
                        <td class="px-3 py-2 font-medium">{{ t.title }}</td>
                        <td class="px-3 py-2">
                          @if (t.category) {
                            <span
                              class="text-xs px-2 py-0.5 rounded-full"
                              [style.background-color]="t.category.color + '33'"
                              [style.color]="t.category.color"
                            >
                              {{ t.category.name }}
                            </span>
                          } @else {
                            <span class="text-text-muted">—</span>
                          }
                        </td>
                        <td
                          class="px-3 py-2 text-right font-medium"
                          [class.text-success]="t.type === 'INCOME'"
                          [class.text-danger]="t.type === 'EXPENSE'"
                        >
                          {{ t.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(t.amount) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }
      </div>
    </div>
  `,
})
export class FinanceDashboardComponent implements OnInit {
  private readonly service = inject(FinanceService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly Math = Math;
  protected readonly loading = signal(true);
  protected readonly boards = signal<FinanceBoard[]>([]);
  protected readonly board = signal<FinanceBoard | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly summary = signal<FinanceSummary | null>(null);
  protected selectedBoardId = '';
  protected selectedMonth = this.currentMonth();

  protected readonly donutData = computed<ChartData<'doughnut'>>(() => {
    const s = this.summary();
    if (!s)
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    return {
      labels: s.byCategory.map((c) => c.categoryName),
      datasets: [
        {
          data: s.byCategory.map((c) => c.total),
          backgroundColor: s.byCategory.map((c) => c.categoryColor),
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly lineData = computed<ChartData<'line'>>(() => {
    const txs = this.transactions();
    const byDay = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const day = t.date.slice(0, 10);
      const bucket = byDay.get(day) ?? { income: 0, expense: 0 };
      if (t.type === 'INCOME') bucket.income += t.amount;
      else bucket.expense += t.amount;
      byDay.set(day, bucket);
    }
    const sortedDays = Array.from(byDay.keys()).sort();
    return {
      labels: sortedDays.map((d) => d.slice(5)),
      datasets: [
        {
          label: 'Income',
          data: sortedDays.map((d) => byDay.get(d)?.income ?? 0),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Expenses',
          data: sortedDays.map((d) => byDay.get(d)?.expense ?? 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  });

  protected readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#a1a1aa' } } },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  protected readonly donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#a1a1aa', boxWidth: 12 } },
    },
  };

  ngOnInit(): void {
    this.service.listBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        const first = boards.find((b) => b.isDefault) ?? boards[0];
        if (first) {
          this.selectedBoardId = first.id;
          this.loadBoard(first.id);
        } else {
          this.loading.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected onBoardChange(id: string): void {
    this.loadBoard(id);
  }

  protected reload(): void {
    const id = this.selectedBoardId;
    if (id) this.loadData(id);
  }

  protected async createBoard(): Promise<void> {
    const name = await this.dialogs.prompt({
      title: 'New board',
      label: 'Board name',
      confirmLabel: 'Create',
    });
    if (!name?.trim()) return;
    this.service.createBoard({ name: name.trim() }).subscribe({
      next: (board) => {
        this.boards.update((arr) => [...arr, board]);
        this.selectedBoardId = board.id;
        this.loadBoard(board.id);
        this.toastr.success('Board created');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected addTransaction(): void {
    const board = this.board();
    if (!board) return;
    const ref = this.dialog.open<
      TransactionDialogComponent,
      TransactionDialogData,
      TransactionDialogResult
    >(TransactionDialogComponent, { data: { board } });
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }

  protected editTransaction(transaction: Transaction): void {
    const board = this.board();
    if (!board) return;
    const ref = this.dialog.open<
      TransactionDialogComponent,
      TransactionDialogData,
      TransactionDialogResult
    >(TransactionDialogComponent, { data: { board, transaction } });
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }

  protected async addBudget(): Promise<void> {
    const board = this.board();
    if (!board) return;
    const name = await this.dialogs.prompt({
      title: 'New budget',
      label: 'Budget name',
      placeholder: 'e.g. Food',
      confirmLabel: 'Continue',
    });
    if (!name?.trim()) return;
    const amountStr = await this.dialogs.prompt({
      title: 'New budget',
      label: 'Amount',
      inputType: 'number',
      confirmLabel: 'Create',
    });
    const amount = amountStr ? Number(amountStr) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      this.toastr.error('Invalid amount');
      return;
    }
    this.service.createBudget(board.id, { name: name.trim(), amount }).subscribe({
      next: () => {
        this.toastr.success('Budget created');
        this.loadBoard(board.id);
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected budgetSpent(budget: Budget): number {
    return this.transactions()
      .filter((t) => t.type === 'EXPENSE' && (!budget.categoryId || t.categoryId === budget.categoryId))
      .reduce((acc, t) => acc + t.amount, 0);
  }

  protected percent(budget: Budget): number {
    if (budget.amount <= 0) return 0;
    return Math.round((this.budgetSpent(budget) / budget.amount) * 100);
  }

  protected formatCurrency(value: number): string {
    const currency = this.board()?.currency ?? 'USD';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  private currentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthRange(): { start: string; end: string } {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();
    return { start, end };
  }

  private loadBoard(id: string): void {
    this.loading.set(true);
    this.service.findBoard(id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loadData(id);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  private loadData(id: string): void {
    const range = this.monthRange();
    this.loading.set(true);
    this.service.listTransactions(id, range).subscribe({
      next: (txs) => {
        this.transactions.set(txs);
        this.service.summary(id, range).subscribe({
          next: (s) => {
            this.summary.set(s);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastr.error(this.errMsg(err));
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
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
