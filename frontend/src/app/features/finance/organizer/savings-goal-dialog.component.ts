import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { OrganizerService } from '../services/organizer.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { NotificationAttachPanelComponent } from '../../../shared/components/notification-attach-panel/notification-attach-panel.component';
import type { SavingsGoal } from '../finance.types';

export interface SavingsGoalDialogData {
  boardId: string;
  item?: SavingsGoal;
}
export type SavingsGoalDialogResult = 'changed' | undefined;

@Component({
  selector: 'app-savings-goal-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, NotificationAttachPanelComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(480px,95vw)] max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">{{ data.item ? 'Edit goal' : 'New savings goal' }}</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Name *</span>
          <input type="text" formControlName="name" maxlength="120" autofocus class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Target amount *</span>
            <input type="number" formControlName="targetAmount" min="0" step="0.01" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Target date</span>
            <input type="date" formControlName="targetDate" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Icon (emoji)</span>
            <input type="text" formControlName="icon" maxlength="8" placeholder="🏖" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Color</span>
            <input type="color" formControlName="color" class="w-20 h-10 bg-background border border-border rounded cursor-pointer" />
          </label>
        </div>

        @if (data.item) {
          <div class="border-t border-border pt-3">
            <app-notification-attach-panel entityType="savings-goal" [entityId]="data.item.id" />
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
export class SavingsGoalDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrganizerService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form;

  constructor(
    public ref: MatDialogRef<SavingsGoalDialogComponent, SavingsGoalDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: SavingsGoalDialogData,
  ) {
    const g = data.item;
    this.form = this.fb.nonNullable.group({
      name: [g?.name ?? '', [Validators.required, Validators.maxLength(120)]],
      targetAmount: [g?.targetAmount ?? 0, [Validators.required, Validators.min(0)]],
      targetDate: [g?.targetDate ? g.targetDate.slice(0, 10) : ''],
      icon: [g?.icon ?? ''],
      color: [g?.color ?? '#22c55e'],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      name: raw.name.trim(),
      targetAmount: Number(raw.targetAmount),
      targetDate: raw.targetDate ? new Date(raw.targetDate).toISOString() : undefined,
      icon: raw.icon.trim() || undefined,
      color: raw.color,
    };
    const req$ = this.data.item
      ? this.service.updateGoal(this.data.item.id, dto)
      : this.service.createGoal(this.data.boardId, dto);
    req$.subscribe({
      next: () => {
        this.toastr.success(this.data.item ? 'Goal updated' : 'Goal created');
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
      title: 'Delete goal',
      message: `Delete "${this.data.item.name}" and its contributions?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteGoal(this.data.item.id).subscribe({
      next: () => {
        this.toastr.success('Goal deleted');
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
