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

interface HeatCell {
  date: string;
  status: HabitEntryStatus | null;
}

interface HabitCalendar {
  weeks: (HeatCell | null)[][];
  pct: number;
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

                @if (goalLabel(habit); as goal) {
                  <p class="text-xs text-text-muted mb-2">🎯 Goal: {{ goal }}</p>
                }

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

                <button
                  type="button"
                  (click)="toggleCalendar(habit)"
                  class="mt-3 text-xs text-text-muted hover:text-text"
                >
                  {{ expanded().has(habit.id) ? '▾ Hide calendar' : '▸ Show calendar' }}
                </button>
                @if (expanded().has(habit.id)) {
                  @if (calMap().get(habit.id); as cal) {
                    <div class="mt-2">
                      <div class="flex gap-[3px] mb-1">
                        @for (d of dayLabels; track d.value) {
                          <span class="w-4 text-center text-[9px] text-text-muted">{{ d.label }}</span>
                        }
                      </div>
                      @for (week of cal.weeks; track $index) {
                        <div class="flex gap-[3px] mb-[3px]">
                          @for (cell of week; track $index) {
                            @if (cell) {
                              <span
                                class="w-4 h-4 rounded-sm"
                                [style.background]="cellColor(cell, habit.color)"
                                [title]="cell.date + (cell.status ? ' · ' + cell.status : '')"
                              ></span>
                            } @else {
                              <span class="w-4 h-4"></span>
                            }
                          }
                        </div>
                      }
                      <p class="text-xs text-text-muted mt-1">{{ cal.pct }}% done this month</p>
                    </div>
                  } @else {
                    <p class="text-xs text-text-muted mt-2">Loading…</p>
                  }
                }
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
  protected readonly expanded = signal<Set<string>>(new Set());
  protected readonly calMap = signal<Map<string, HabitCalendar>>(new Map());

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
        this.loadTodayEntries();
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Could not load habits');
      },
    });
  }

  private loadTodayEntries(): void {
    this.service.today().subscribe({
      next: (entries) => {
        const marks = new Map<string, boolean>();
        for (const e of entries) {
          if (e.status === 'DONE' || e.status === 'RECOVERED') marks.set(e.habitId, true);
        }
        this.todayMarks.set(marks);
      },
      error: () => undefined,
    });
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
          this.refreshCalendar(habit.id);
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
          this.refreshCalendar(habit.id);
        },
        error: () => this.toastr.error('Could not mark'),
      });
    }
  }

  protected toggleCalendar(habit: Habit): void {
    const next = new Set(this.expanded());
    if (next.has(habit.id)) {
      next.delete(habit.id);
      this.expanded.set(next);
      return;
    }
    next.add(habit.id);
    this.expanded.set(next);
    if (!this.calMap().has(habit.id)) this.fetchCalendar(habit.id);
  }

  private fetchCalendar(habitId: string): void {
    this.service.stats(habitId).subscribe({
      next: (s) => {
        const m = new Map(this.calMap());
        m.set(habitId, { weeks: this.buildWeeks(s.heatmap), pct: s.monthCompletionPct });
        this.calMap.set(m);
      },
      error: () => this.toastr.error('Could not load the calendar'),
    });
  }

  /** Keep an open calendar fresh after marking; otherwise drop the stale cache. */
  private refreshCalendar(habitId: string): void {
    if (this.expanded().has(habitId)) {
      this.fetchCalendar(habitId);
    } else if (this.calMap().has(habitId)) {
      const m = new Map(this.calMap());
      m.delete(habitId);
      this.calMap.set(m);
    }
  }

  /** Lay the heatmap out as week rows (Monday-first), padding the first week. */
  private buildWeeks(heatmap: HeatCell[]): (HeatCell | null)[][] {
    if (!heatmap.length) return [];
    const cells: (HeatCell | null)[] = [];
    const first = new Date(heatmap[0].date + 'T00:00:00');
    const mondayIndex = (first.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
    for (let i = 0; i < mondayIndex; i++) cells.push(null);
    for (const h of heatmap) cells.push(h);
    const weeks: (HeatCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  protected goalLabel(habit: Habit): string | null {
    if (!habit.goalPeriod || !habit.goalTarget) return null;
    const period = habit.goalPeriod.toLowerCase();
    return `${habit.goalTarget}× ${period}`;
  }

  protected cellColor(cell: HeatCell, habitColor: string): string {
    if (cell.status === 'DONE' || cell.status === 'RECOVERED') return habitColor;
    if (cell.status === 'MISSED') return 'color-mix(in srgb, var(--color-danger) 55%, transparent)';
    if (cell.status === 'REST') return 'var(--color-surface-hover)';
    return 'var(--color-background)';
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
