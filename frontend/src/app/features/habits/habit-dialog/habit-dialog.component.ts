import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { HabitsService } from '../services/habits.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { EmojiPickerComponent } from '../../../shared/components/emoji-picker/emoji-picker.component';
import type { CreateHabitDto, GoalPeriod, Habit } from '../habits.types';

export interface HabitDialogData {
  habit?: Habit;
}

export type HabitDialogResult = Habit | { deleted: string } | undefined;

const DAYS = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
];

@Component({
  selector: 'app-habit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, EmojiPickerComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(480px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">{{ data.habit ? 'Edit habit' : 'New habit' }}</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div class="flex gap-3 items-start">
          <div>
            <span class="block text-xs text-text-muted mb-1">Icon</span>
            <app-emoji-picker
              [initialValue]="icon()"
              placeholder="🔥"
              (valueChange)="setIcon($event)"
            />
          </div>
          <label class="flex-1 block">
            <span class="block text-xs text-text-muted mb-1">Name *</span>
            <input
              type="text"
              formControlName="name"
              maxlength="100"
              autofocus
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Description</span>
          <textarea
            formControlName="description"
            rows="2"
            maxlength="500"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
          ></textarea>
        </label>

        <div>
          <span class="block text-xs text-text-muted mb-1">Active days</span>
          <div class="flex gap-2">
            @for (d of days; track d.value) {
              <button
                type="button"
                (click)="toggleDay(d.value)"
                [class]="
                  'w-9 h-9 rounded-full text-xs font-medium transition-colors ' +
                  (activeDays().has(d.value) ? 'bg-primary text-white' : 'bg-background border border-border text-text-muted hover:text-text')
                "
              >{{ d.label }}</button>
            }
          </div>
          <p class="text-xs text-text-muted mt-1">Unmarked days are rest days and don't break the streak.</p>
        </div>

        <div>
          <span class="block text-xs text-text-muted mb-1">Goal (optional)</span>
          <div class="grid grid-cols-2 gap-3">
            <select
              formControlName="goalPeriod"
              class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            >
              <option value="">No goal</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <input
              type="number"
              min="1"
              max="366"
              formControlName="goalTarget"
              placeholder="times / period"
              [disabled]="!form.controls.goalPeriod.value"
              class="px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
          <p class="text-xs text-text-muted mt-1">
            e.g. 3 times per week. Leave on "No goal" to just track the streak.
          </p>
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Color</span>
          <input
            type="color"
            formControlName="color"
            class="w-20 h-10 bg-background border border-border rounded cursor-pointer"
          />
        </label>

        @if (error()) { <p class="text-sm text-danger">{{ error() }}</p> }

        <div class="flex justify-between items-center pt-2">
          @if (data.habit) {
            <button type="button" (click)="remove()" [disabled]="loading()" class="text-sm text-danger hover:underline">
              Delete habit
            </button>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">
              Cancel
            </button>
            <button type="submit" [disabled]="form.invalid || activeDays().size === 0 || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {{ loading() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class HabitDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HabitsService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly icon = signal<string | null>(null);
  protected readonly activeDays = signal<Set<number>>(new Set([1, 2, 3, 4, 5]));
  protected readonly days = DAYS;

  protected readonly form;

  constructor(
    public ref: MatDialogRef<HabitDialogComponent, HabitDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: HabitDialogData,
  ) {
    const h = data.habit;
    this.form = this.fb.nonNullable.group({
      name: [h?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      description: [h?.description ?? ''],
      color: [h?.color ?? '#6366f1'],
      goalPeriod: [(h?.goalPeriod ?? '') as GoalPeriod | ''],
      goalTarget: [h?.goalTarget ?? null as number | null],
    });
    if (h) {
      this.icon.set(h.icon);
      this.activeDays.set(new Set(h.activeDays));
    }
  }

  setIcon(v: string | null): void {
    this.icon.set(v);
  }

  toggleDay(day: number): void {
    const next = new Set(this.activeDays());
    if (next.has(day)) next.delete(day);
    else next.add(day);
    this.activeDays.set(next);
  }

  submit(): void {
    if (this.form.invalid || this.activeDays().size === 0 || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const dto: CreateHabitDto = {
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      icon: this.icon() ?? undefined,
      color: raw.color,
      activeDays: Array.from(this.activeDays()),
      goalPeriod: raw.goalPeriod ? (raw.goalPeriod as GoalPeriod) : undefined,
      goalTarget: raw.goalPeriod && raw.goalTarget ? Number(raw.goalTarget) : undefined,
    };

    const req$ = this.data.habit
      ? this.service.update(this.data.habit.id, dto)
      : this.service.create(dto);

    req$.subscribe({
      next: (habit) => {
        this.toastr.success(this.data.habit ? 'Habit updated' : 'Habit created');
        this.ref.close(habit);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        this.error.set(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Error');
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.habit || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete habit',
      message: `Delete the habit "${this.data.habit.name}"? All history will be lost.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.loading.set(true);
    this.service.delete(this.data.habit.id).subscribe({
      next: ({ id }) => {
        this.toastr.success('Habit deleted');
        this.ref.close({ deleted: id });
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Could not delete');
      },
    });
  }
}
