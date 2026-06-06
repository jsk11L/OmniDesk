import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { OrganizerService } from '../services/organizer.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { NotificationAttachPanelComponent } from '../../../shared/components/notification-attach-panel/notification-attach-panel.component';
import type { FinanceCategory, PlannedPurchase } from '../finance.types';

export interface PlannedPurchaseDialogData {
  boardId: string;
  categories: FinanceCategory[];
  item?: PlannedPurchase;
}
export type PlannedPurchaseDialogResult = 'changed' | undefined;

@Component({
  selector: 'app-planned-purchase-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, NotificationAttachPanelComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(520px,95vw)] max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">{{ data.item ? 'Edit planned purchase' : 'New planned purchase' }}</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input type="text" formControlName="title" maxlength="200" autofocus class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Amount *</span>
            <input type="number" formControlName="amount" min="0" step="0.01" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Target date *</span>
            <input type="date" formControlName="targetDate" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
        </div>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Category (optional)</span>
          <select formControlName="categoryId" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
            <option value="">—</option>
            @for (c of expenseCategories; track c.id) {
              <option [value]="c.id">{{ c.icon ? c.icon + ' ' : '' }}{{ c.name }}</option>
            }
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Notes</span>
          <textarea formControlName="notes" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"></textarea>
        </label>

        @if (data.item) {
          <div class="border-t border-border pt-3">
            <app-notification-attach-panel entityType="planned-purchase" [entityId]="data.item.id" />
          </div>
        }
        @if (error()) { <p class="text-sm text-danger">{{ error() }}</p> }

        <div class="flex justify-between items-center pt-2">
          @if (data.item) {
            <button type="button" (click)="remove()" class="text-sm text-danger hover:underline">Delete</button>
          } @else { <span></span> }
          <div class="flex gap-2">
            <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">Cancel</button>
            <button type="submit" [disabled]="form.invalid || loading()" class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">{{ loading() ? 'Saving…' : 'Save' }}</button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class PlannedPurchaseDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrganizerService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expenseCategories: FinanceCategory[];
  protected readonly form;

  constructor(
    public ref: MatDialogRef<PlannedPurchaseDialogComponent, PlannedPurchaseDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: PlannedPurchaseDialogData,
  ) {
    this.expenseCategories = (data.categories ?? []).filter((c) => c.categoryType === 'EXPENSE');
    const i = data.item;
    this.form = this.fb.nonNullable.group({
      title: [i?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      amount: [i?.amount ?? 0, [Validators.required, Validators.min(0)]],
      targetDate: [i ? i.targetDate.slice(0, 10) : '', [Validators.required]],
      categoryId: [i?.categoryId ?? ''],
      notes: [i?.notes ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      title: raw.title.trim(),
      amount: Number(raw.amount),
      targetDate: new Date(raw.targetDate).toISOString(),
      categoryId: raw.categoryId || undefined,
      notes: raw.notes.trim() || undefined,
    };
    const req$ = this.data.item
      ? this.service.updatePlanned(this.data.item.id, dto)
      : this.service.createPlanned(this.data.boardId, dto);
    req$.subscribe({
      next: () => {
        this.toastr.success(this.data.item ? 'Updated' : 'Added');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.msg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.item) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete planned purchase',
      message: `Delete "${this.data.item.title}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deletePlanned(this.data.item.id).subscribe({
      next: () => {
        this.toastr.success('Deleted');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => this.error.set(this.msg(err)),
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
