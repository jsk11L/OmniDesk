import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { FinanceService } from '../services/finance.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type { Budget, BudgetPeriod, FinanceCategory } from '../finance.types';

export interface BudgetDialogData {
  boardId: string;
  categories: FinanceCategory[];
  budget?: Budget;
}

export type BudgetDialogResult = 'changed' | undefined;

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ANNUAL', label: 'Annual' },
];

@Component({
  selector: 'app-budget-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(480px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">{{ data.budget ? 'Edit budget' : 'New budget' }}</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Name *</span>
          <input
            type="text"
            formControlName="name"
            maxlength="100"
            autofocus
            placeholder="e.g. Food, Rent, Subscriptions"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Amount *</span>
            <input
              type="number"
              formControlName="amount"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Period</span>
            <select
              formControlName="period"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            >
              @for (p of periods; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
          </label>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Category (optional)</span>
          <select
            formControlName="categoryId"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          >
            <option value="">All expenses</option>
            @for (c of expenseCategories; track c.id) {
              <option [value]="c.id">{{ c.icon ? c.icon + ' ' : '' }}{{ c.name }}</option>
            }
          </select>
          <span class="block text-xs text-text-faint mt-1">
            Limits the budget to a single expense category. Leave on "All expenses" to track total spend.
          </span>
        </label>

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          @if (data.budget) {
            <button
              type="button"
              (click)="remove()"
              [disabled]="loading()"
              class="text-sm text-danger hover:underline"
            >
              Delete
            </button>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button
              type="button"
              (click)="ref.close()"
              class="px-4 py-2 text-sm rounded hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ loading() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class BudgetDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FinanceService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly periods = PERIODS;
  protected readonly expenseCategories: FinanceCategory[];

  protected readonly form;

  constructor(
    public ref: MatDialogRef<BudgetDialogComponent, BudgetDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: BudgetDialogData,
  ) {
    this.expenseCategories = (data.categories ?? []).filter((c) => c.categoryType === 'EXPENSE');
    const b = data.budget;
    this.form = this.fb.nonNullable.group({
      name: [b?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      amount: [b?.amount ?? 0, [Validators.required, Validators.min(0)]],
      period: [(b?.period ?? 'MONTHLY') as BudgetPeriod],
      categoryId: [b?.categoryId ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    const raw = this.form.getRawValue();
    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      this.error.set('Invalid amount');
      return;
    }
    this.error.set(null);
    this.loading.set(true);

    const payload = {
      name: raw.name.trim(),
      amount,
      period: raw.period,
      categoryId: raw.categoryId || undefined,
    };

    const request$ = this.data.budget
      ? this.service.updateBudget(this.data.boardId, this.data.budget.id, payload)
      : this.service.createBudget(this.data.boardId, payload);

    request$.subscribe({
      next: () => {
        this.toastr.success(this.data.budget ? 'Budget updated' : 'Budget created');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.budget || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete budget',
      message: `Delete the budget "${this.data.budget.name}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.loading.set(true);
    this.service.deleteBudget(this.data.boardId, this.data.budget.id).subscribe({
      next: () => {
        this.toastr.success('Budget deleted');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
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
