import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { HabitsService } from '../services/habits.service';
import {
  HabitDialogComponent,
  type HabitDialogData,
  type HabitDialogResult,
} from '../habit-dialog/habit-dialog.component';
import type { Habit, HabitEntryStatus } from '../habits.types';

interface HabitTodayState {
  todayStatus: HabitEntryStatus | null;
  isActiveToday: boolean;
}

@Component({
  selector: 'app-habits-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Habits</h1>
          <p class="text-sm text-text-muted">Build streaks and watch your progress.</p>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          + New habit
        </button>
      </header>

      <div class="flex-1 overflow-auto p-6">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (habits().length === 0) {
          <div class="text-center py-16 text-text-muted">
            <p class="mb-4">You don't have any habits yet. Create your first to start building streaks.</p>
            <button type="button" (click)="openCreate()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">
              + Create first habit
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (habit of habits(); track habit.id) {
              <div class="bg-surface border border-border rounded-xl p-4 hover:border-primary transition-colors"
                   [style.border-left]="'4px solid ' + habit.color">
                <div class="flex items-start justify-between mb-2">
                  <button type="button" (click)="openEdit(habit)" class="flex items-center gap-2 text-left">
                    @if (habit.icon) { <span class="text-xl">{{ habit.icon }}</span> }
                    <h2 class="font-semibold">{{ habit.name }}</h2>
                  </button>
                  <button
                    type="button"
                    (click)="toggleToday(habit)"
                    [title]="isDoneToday(habit) ? 'Unmark today' : 'Mark as done today'"
                    [class]="
                      'w-10 h-10 rounded-full text-lg font-bold transition-colors ' +
                      (isDoneToday(habit) ? 'bg-success text-white' : 'border-2 border-border text-text-muted hover:border-primary')
                    "
                  >{{ isDoneToday(habit) ? '✓' : '○' }}</button>
                </div>

                @if (habit.description) {
                  <p class="text-xs text-text-muted mb-3">{{ habit.description }}</p>
                }

                <div class="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p class="text-xl font-bold">{{ habit.currentStreak }}</p>
                    <p class="text-xs text-text-muted">Streak</p>
                  </div>
                  <div>
                    <p class="text-xl font-bold">{{ habit.longestStreak }}</p>
                    <p class="text-xs text-text-muted">Longest</p>
                  </div>
                  <div>
                    <p class="text-xl font-bold">{{ habit.perfectWeeks }}</p>
                    <p class="text-xs text-text-muted">Wk ✓</p>
                  </div>
                </div>

                <div class="flex gap-1 text-xs">
                  @for (d of dayLabels; track d.value) {
                    <span
                      [class]="
                        'w-6 h-6 flex items-center justify-center rounded-full ' +
                        (habit.activeDays.includes(d.value)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-surface-hover text-text-muted opacity-40')
                      "
                    >{{ d.label }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class HabitsHomeComponent implements OnInit {
  private readonly service = inject(HabitsService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  protected readonly habits = signal<Habit[]>([]);
  protected readonly loading = signal(true);
  protected readonly todayMarks = signal<Map<string, boolean>>(new Map());

  protected readonly dayLabels = [
    { value: 1, label: 'M' },
    { value: 2, label: 'T' },
    { value: 3, label: 'W' },
    { value: 4, label: 'T' },
    { value: 5, label: 'F' },
    { value: 6, label: 'S' },
    { value: 0, label: 'S' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
        this.loadTodayEntries(habits);
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Could not load habits');
      },
    });
  }

  private loadTodayEntries(habits: Habit[]): void {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const marks = new Map<string, boolean>();
    let pending = habits.length;
    if (pending === 0) return;
    for (const h of habits) {
      this.service.entries(h.id, dateStr, dateStr).subscribe({
        next: (entries) => {
          const done = entries.some((e) => e.status === 'DONE' || e.status === 'RECOVERED');
          marks.set(h.id, done);
          if (--pending === 0) this.todayMarks.set(new Map(marks));
        },
        error: () => {
          if (--pending === 0) this.todayMarks.set(new Map(marks));
        },
      });
    }
  }

  protected isDoneToday(habit: Habit): boolean {
    return this.todayMarks().get(habit.id) ?? false;
  }

  protected toggleToday(habit: Habit): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.isDoneToday(habit)) {
      this.service.deleteEntry(habit.id, today).subscribe({
        next: () => {
          this.todayMarks.update((m) => {
            const next = new Map(m);
            next.set(habit.id, false);
            return next;
          });
          this.reload();
        },
        error: () => this.toastr.error('Could not unmark'),
      });
    } else {
      this.service.markEntry(habit.id, { date: today, status: 'DONE' }).subscribe({
        next: () => {
          this.todayMarks.update((m) => {
            const next = new Map(m);
            next.set(habit.id, true);
            return next;
          });
          this.reload();
        },
        error: () => this.toastr.error('Could not mark'),
      });
    }
  }

  protected openCreate(): void {
    const ref = this.dialog.open<HabitDialogComponent, HabitDialogData, HabitDialogResult>(
      HabitDialogComponent,
      { data: {} },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }

  protected openEdit(habit: Habit): void {
    const ref = this.dialog.open<HabitDialogComponent, HabitDialogData, HabitDialogResult>(
      HabitDialogComponent,
      { data: { habit } },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }
}
