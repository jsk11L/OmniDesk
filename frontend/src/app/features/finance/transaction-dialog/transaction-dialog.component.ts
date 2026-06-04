import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { FinanceService } from '../services/finance.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type {
  FinanceBoard,
  FinanceCategoryType,
  Transaction,
} from '../finance.types';

export interface TransactionDialogData {
  board: FinanceBoard;
  transaction?: Transaction;
}

export type TransactionDialogResult = Transaction | { deleted: string } | undefined;

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(520px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">
        {{ data.transaction ? 'Edit transaction' : 'New transaction' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div class="flex gap-2">
          <button
            type="button"
            (click)="setType('INCOME')"
            [class]="
              'flex-1 py-2 rounded text-sm font-medium transition-colors ' +
              (form.value.type === 'INCOME'
                ? 'bg-success text-white'
                : 'bg-background text-text-muted hover:text-text')
            "
          >
            ↑ Income
          </button>
          <button
            type="button"
            (click)="setType('EXPENSE')"
            [class]="
              'flex-1 py-2 rounded text-sm font-medium transition-colors ' +
              (form.value.type === 'EXPENSE'
                ? 'bg-danger text-white'
                : 'bg-background text-text-muted hover:text-text')
            "
          >
            ↓ Expense
          </button>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input
            type="text"
            formControlName="title"
            maxlength="200"
            autofocus
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Amount *</span>
            <input
              type="number"
              formControlName="amount"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Date *</span>
            <input
              type="date"
              formControlName="date"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Category</span>
          <select
            formControlName="categoryId"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          >
            <option value="">No category</option>
            @for (c of filteredCategories(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Notes</span>
          <textarea
            formControlName="notes"
            rows="2"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
          ></textarea>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Tags (comma-separated)</span>
          <input
            type="text"
            formControlName="tags"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            placeholder="recurring, work"
          />
        </label>

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          @if (data.transaction) {
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
export class TransactionDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FinanceService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form;

  constructor(
    public ref: MatDialogRef<TransactionDialogComponent, TransactionDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionDialogData,
  ) {
    const t = data.transaction;
    this.form = this.fb.nonNullable.group({
      type: [(t?.type ?? 'EXPENSE') as FinanceCategoryType],
      title: [t?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      amount: [t?.amount ?? 0, [Validators.required, Validators.min(0)]],
      date: [t?.date ? t.date.slice(0, 10) : new Date().toISOString().slice(0, 10), Validators.required],
      categoryId: [t?.categoryId ?? ''],
      notes: [t?.notes ?? ''],
      tags: [(t?.tags ?? []).join(', ')],
    });
  }

  protected setType(type: FinanceCategoryType): void {
    this.form.controls.type.setValue(type);
    this.form.controls.categoryId.setValue('');
  }

  protected filteredCategories() {
    const type = this.form.value.type;
    return (this.data.board.categories ?? []).filter((c) => c.categoryType === type);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: raw.title.trim(),
      amount: Number(raw.amount),
      type: raw.type,
      date: new Date(raw.date).toISOString(),
      categoryId: raw.categoryId || undefined,
      notes: raw.notes.trim() || undefined,
      tags,
    };

    const request$ = this.data.transaction
      ? this.service.updateTransaction(this.data.board.id, this.data.transaction.id, payload)
      : this.service.createTransaction(this.data.board.id, payload);

    request$.subscribe({
      next: (transaction) => {
        this.toastr.success(this.data.transaction ? 'Transaction updated' : 'Transaction created');
        this.ref.close(transaction);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.transaction || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete transaction',
      message: 'Delete this transaction?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.loading.set(true);
    this.service
      .deleteTransaction(this.data.board.id, this.data.transaction.id)
      .subscribe({
        next: ({ id }) => {
          this.toastr.success('Transaction deleted');
          this.ref.close({ deleted: id });
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
