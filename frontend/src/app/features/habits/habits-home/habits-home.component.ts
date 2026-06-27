import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { HabitsService } from '../services/habits.service';
import {
  HabitDialogComponent,
  type HabitDialogData,
  type HabitDialogResult,
} from '../habit-dialog/habit-dialog.component';
import type { Habit, HabitEntryStatus, HabitStats, HabitWeek } from '../habits.types';

@Component({
  selector: 'app-habits-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <div class="uppercase-tag">Habits</div>
          <h1 class="page-title mt-1">Habits</h1>
          @if (habits().length > 0) {
            <p class="page-subtitle">
              {{ habits().length }} habit(s) · {{ doneTodayCount() }} done today
            </p>
            <p class="text-xs text-faint mt-1">
              Dashed cells are editable (today &amp; yesterday) · older days lock 🔒
            </p>
          }
        </div>
        <button type="button" (click)="openCreate()" class="btn btn-primary">+ New habit</button>
      </header>

      @if (loading()) {
        <p class="text-muted">Loading…</p>
      } @else if (habits().length === 0) {
        <div class="panel panel-pad text-center" style="padding: 48px 24px">
          <p class="text-muted mb-3">You don't have any habits yet. Create your first to start building streaks.</p>
          <button type="button" (click)="openCreate()" class="btn btn-primary">+ Create first habit</button>
        </div>
      } @else {
        <!-- Hero: featured streak + heatmap -->
        @if (featured(); as f) {
          <div class="panel hero">
            <div class="hero-top">
              <div class="hero-icon">{{ f.icon ?? '🔥' }}</div>
              <div style="flex: 1; min-width: 0">
                <div class="uppercase-tag">Best active streak</div>
                <div class="hero-name">{{ f.name }}</div>
                @if (goalLabel(f); as g) {
                  <div class="text-xs text-muted mono mt-1">{{ g }}</div>
                }
              </div>
              <div style="text-align: right">
                <div class="hero-streak mono">{{ f.currentStreak }}<span class="hero-streak-u">d</span></div>
                <div class="text-xs text-faint mono">current · best {{ f.longestStreak }}d</div>
              </div>
            </div>

            @if (heatCells().length > 0) {
              <div class="hero-heat-wrap">
                <div class="uppercase-tag mb-2">Last 13 weeks</div>
                <div class="heat-grid">
                  @for (c of heatCells(); track $index) {
                    <div class="heat-cell" [style.background]="heatColor(c)"></div>
                  }
                </div>
                <div class="heat-legend mono text-xs text-faint">
                  <span>less</span>
                  <span class="heat-cell legend" style="background: var(--color-surface-2)"></span>
                  <span class="heat-cell legend" style="background: color-mix(in srgb, var(--color-primary) 35%, transparent)"></span>
                  <span class="heat-cell legend" style="background: var(--color-primary)"></span>
                  <span>more</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- Habit cards -->
        <div class="cards">
          @for (habit of habits(); track habit.id) {
            <div class="panel card">
              <div class="card-head">
                <button type="button" (click)="openEdit(habit)" class="card-tile" [style.background]="tileBg(habit.color)">
                  {{ habit.icon ?? '🔁' }}
                </button>
                <button type="button" (click)="openEdit(habit)" class="card-titles">
                  <div class="card-name">{{ habit.name }}</div>
                  @if (goalLabel(habit); as g) {
                    <div class="text-xs text-muted mono">{{ g }}</div>
                  } @else {
                    <div class="text-xs text-faint mono">no goal set</div>
                  }
                </button>
                <div class="card-streak mono" [style.color]="'var(--color-accent)'">🔥 {{ habit.currentStreak }}d</div>
              </div>

              @if (weekFor(habit.id); as wk) {
                <div class="week-row">
                  @for (d of wk; track d.date) {
                    <div class="week-cell">
                      <div class="mono text-xs text-faint week-dow">{{ dowLabel(d.date) }}</div>
                      <button
                        type="button"
                        [disabled]="isFuture(d.date)"
                        (click)="toggleDay(habit, d.date, d.status)"
                        class="week-btn"
                        [class.is-today]="isToday(d.date) && !isDone(d.status)"
                        [class.is-editable]="isEditable(d.date) && !isDone(d.status)"
                        [class.is-locked]="!isEditable(d.date) && !isFuture(d.date) && !isDone(d.status)"
                        [class.is-rest]="!isActiveDay(habit, d.date)"
                        [style.background]="dayBg(habit, d.date, d.status)"
                        [style.color]="isDone(d.status) ? '#fff' : 'var(--color-text-faint)'"
                        [title]="isEditable(d.date) ? d.date : d.date + ' · locked (only today & yesterday)'"
                      >
                        @if (isDone(d.status)) { ✓ } @else if (isEditable(d.date)) { + } @else if (isLockedPast(d.date)) { 🔒 }
                      </button>
                    </div>
                  }
                </div>
                <div class="week-foot mono text-xs text-faint">
                  <span>{{ doneInWeek(wk) }} / 7 this week</span>
                  <span>{{ weekPct(wk) }}%</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px 80px; max-width: 1400px; margin: 0 auto; }
    @media (max-width: 640px) { .page { padding: 18px 16px 64px; } }

    .page-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 16px; margin-bottom: 22px; flex-wrap: wrap;
    }
    .page-title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
    .page-subtitle { color: var(--color-text-muted); font-size: 13px; margin-top: 4px; }

    .text-muted { color: var(--color-text-muted); }
    .text-faint { color: var(--color-text-faint); }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-1 { margin-top: 4px; }
    .text-xs { font-size: 11px; }

    /* Hero */
    .hero { margin-bottom: 18px; padding: 20px 24px; }
    .hero-top { display: flex; align-items: center; gap: 18px; }
    .hero-icon {
      width: 64px; height: 64px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      display: grid; place-items: center; font-size: 28px;
    }
    .hero-name { font-size: 20px; font-weight: 600; margin-top: 2px; }
    .hero-streak { font-size: 36px; font-weight: 700; color: var(--color-accent); letter-spacing: -0.02em; line-height: 1; }
    .hero-streak-u { font-size: 14px; }

    .hero-heat-wrap { margin-top: 18px; }
    .heat-grid {
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 3px;
    }
    .heat-cell { aspect-ratio: 1; max-width: 16px; border-radius: 3px; }
    .heat-legend { display: flex; gap: 6px; align-items: center; margin-top: 12px; }
    .heat-cell.legend { width: 12px; height: 12px; max-width: none; }

    /* Cards */
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }
    .card { padding: 18px; }
    .card-head { display: flex; align-items: center; gap: 12px; }
    .card-tile {
      width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
      display: grid; place-items: center; font-size: 18px; cursor: pointer; border: none;
    }
    .card-titles { flex: 1; min-width: 0; text-align: left; background: none; border: none; cursor: pointer; padding: 0; }
    .card-name { font-size: 14px; font-weight: 600; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-streak { font-size: 15px; font-weight: 600; flex-shrink: 0; }

    .week-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; }
    .week-cell { text-align: center; }
    .week-dow { margin-bottom: 4px; }
    .week-btn {
      width: 100%; aspect-ratio: 1; max-height: 34px;
      border: none; cursor: pointer; border-radius: 6px;
      font-family: inherit; font-size: 12px;
      display: grid; place-items: center;
      transition: transform 80ms;
    }
    .week-btn:hover:not(:disabled) { transform: scale(1.08); }
    .week-btn:disabled { cursor: default; opacity: 0.5; }
    .week-btn.is-today { outline: 1px solid var(--color-primary); outline-offset: -1px; }
    /* Editable (today/yesterday, not yet done): dashed ring + clickable cursor. */
    .week-btn.is-editable { outline: 1px dashed var(--color-primary); outline-offset: -1px; color: var(--color-primary) !important; }
    /* Locked past day: dimmed, non-interactive look. */
    .week-btn.is-locked { opacity: 0.45; }
    .week-foot { display: flex; justify-content: space-between; margin-top: 10px; }
  `],
})
export class HabitsHomeComponent implements OnInit {
  private readonly service = inject(HabitsService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  protected readonly habits = signal<Habit[]>([]);
  protected readonly loading = signal(true);
  protected readonly weekData = signal<Map<string, HabitWeek['days']>>(new Map());
  protected readonly featuredStats = signal<HabitStats | null>(null);

  private readonly todayStr = new Date().toISOString().slice(0, 10);
  private readonly yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  private readonly weekDayOrder = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  /** Habit with the highest active streak — drives the hero panel. */
  protected readonly featured = computed(() => {
    const list = this.habits();
    if (list.length === 0) return null;
    return list.reduce((best, h) => (h.currentStreak > best.currentStreak ? h : best), list[0]);
  });

  protected readonly doneTodayCount = computed(() => {
    let n = 0;
    for (const days of this.weekData().values()) {
      const today = days.find((d) => d.date === this.todayStr);
      if (today && this.isDone(today.status)) n++;
    }
    return n;
  });

  /** Featured habit's 90-day heatmap, padded Monday-first into 7-row columns. */
  protected readonly heatCells = computed<({ status: HabitEntryStatus | null } | null)[]>(() => {
    const map = this.featuredStats()?.heatmap;
    if (!map || map.length === 0) return [];
    const first = new Date(map[0].date + 'T00:00:00');
    const pad = (first.getDay() + 6) % 7; // Monday = 0
    const cells: ({ status: HabitEntryStatus | null } | null)[] = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (const c of map) cells.push({ status: c.status });
    return cells;
  });

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
        this.loadWeek();
        this.loadFeaturedHeatmap();
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Could not load habits');
      },
    });
  }

  private loadWeek(): void {
    this.service.week().subscribe({
      next: (rows) => {
        const m = new Map<string, HabitWeek['days']>();
        for (const r of rows) m.set(r.habitId, r.days);
        this.weekData.set(m);
      },
      error: () => undefined,
    });
  }

  private loadFeaturedHeatmap(): void {
    const f = this.featured();
    if (!f) {
      this.featuredStats.set(null);
      return;
    }
    this.service.stats(f.id).subscribe({
      next: (s) => this.featuredStats.set(s),
      error: () => this.featuredStats.set(null),
    });
  }

  protected weekFor(habitId: string): HabitWeek['days'] | undefined {
    return this.weekData().get(habitId);
  }

  protected isDone(status: HabitEntryStatus | null): boolean {
    return status === 'DONE' || status === 'RECOVERED';
  }

  protected isToday(date: string): boolean {
    return date === this.todayStr;
  }

  protected isFuture(date: string): boolean {
    return date > this.todayStr;
  }

  /** Only today and yesterday can be checked/unchecked; older days lock. */
  protected isEditable(date: string): boolean {
    return date === this.todayStr || date === this.yesterdayStr;
  }

  protected isLockedPast(date: string): boolean {
    return !this.isEditable(date) && !this.isFuture(date);
  }

  protected isActiveDay(habit: Habit, date: string): boolean {
    return habit.activeDays.includes(new Date(date + 'T00:00:00').getDay());
  }

  protected dowLabel(date: string): string {
    const dow = (new Date(date + 'T00:00:00').getDay() + 6) % 7; // Monday = 0
    return this.weekDayOrder[dow];
  }

  protected dayBg(habit: Habit, date: string, status: HabitEntryStatus | null): string {
    if (this.isDone(status)) {
      return this.isToday(date) ? 'var(--color-primary)' : 'var(--color-primary-soft)';
    }
    return 'var(--color-surface-2)';
  }

  protected doneInWeek(days: HabitWeek['days']): number {
    return days.filter((d) => this.isDone(d.status)).length;
  }

  protected weekPct(days: HabitWeek['days']): number {
    return Math.round((this.doneInWeek(days) / 7) * 100);
  }

  protected heatColor(cell: { status: HabitEntryStatus | null } | null): string {
    if (!cell) return 'transparent';
    if (this.isDone(cell.status)) return 'var(--color-primary)';
    if (cell.status === 'MISSED') return 'color-mix(in srgb, var(--color-danger) 35%, transparent)';
    return 'var(--color-surface-2)';
  }

  protected tileBg(color: string): string {
    return `color-mix(in srgb, ${color} 22%, var(--color-surface-2))`;
  }

  protected goalLabel(habit: Habit): string | null {
    if (!habit.goalPeriod || !habit.goalTarget) return null;
    return `${habit.goalTarget}× ${habit.goalPeriod.toLowerCase()}`;
  }

  protected toggleDay(habit: Habit, date: string, status: HabitEntryStatus | null): void {
    if (!this.isEditable(date)) {
      this.toastr.info('You can only check today and yesterday');
      return;
    }
    const done = this.isDone(status);
    const req$ = done
      ? this.service.deleteEntry(habit.id, date)
      : this.service.markEntry(habit.id, { date, status: 'DONE' });
    req$.subscribe({
      next: () => this.reload(),
      error: () => this.toastr.error(done ? 'Could not unmark' : 'Could not mark'),
    });
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
