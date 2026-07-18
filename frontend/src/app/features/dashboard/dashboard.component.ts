import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from './dashboard.service';
import {
  DASHBOARD_WIDGETS,
  resolveDashboardWidgets,
  type DashboardData,
  type DashboardWidgetPref,
} from './dashboard.types';

interface MiniCell {
  day: number | null;
  isToday: boolean;
  dots: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, NgTemplateOutlet],
  template: `
    <div class="page">
      @if (data(); as d) {
        <!-- Greeting -->
        <header class="page-header">
          <div>
            <div class="uppercase-tag">{{ today() }}</div>
            <h1 class="page-title mt-1">{{ greeting() }}</h1>
            <p class="page-subtitle">{{ subtitle(d) }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button type="button" (click)="toggleCustomize()"
              class="btn btn-sm" [class.btn-primary]="customizeOpen()">⚙ Customize</button>
            <a routerLink="/app/calendar" class="btn btn-sm">📅 Calendar</a>
            <a routerLink="/app/todos" class="btn btn-sm btn-primary">✓ Tasks</a>
          </div>
        </header>

        <!-- Customize panel -->
        @if (customizeOpen()) {
          <section class="panel cz">
            <div class="panel-header">
              <div>
                <div class="panel-title">Customize dashboard</div>
                <div class="panel-sub">Show/hide and reorder your widgets — saved automatically</div>
              </div>
              <button type="button" (click)="resetWidgets()" class="btn btn-sm btn-ghost">Reset</button>
            </div>
            <div class="cz-grid">
              <div>
                <p class="uppercase-tag cz-head">Stat cards</p>
                @for (w of statRows(); track w.id) {
                  <div class="cz-row">
                    <label class="cz-label">
                      <input type="checkbox" [checked]="w.visible" (change)="toggleWidget(w.id)" class="accent-primary" />
                      {{ w.label }}
                    </label>
                    <button type="button" (click)="moveWidget(w.id, -1)" class="cz-btn" title="Move up">↑</button>
                    <button type="button" (click)="moveWidget(w.id, 1)" class="cz-btn" title="Move down">↓</button>
                  </div>
                }
              </div>
              <div>
                <p class="uppercase-tag cz-head">Panels</p>
                @for (w of panelRows(); track w.id) {
                  <div class="cz-row">
                    <label class="cz-label">
                      <input type="checkbox" [checked]="w.visible" (change)="toggleWidget(w.id)" class="accent-primary" />
                      {{ w.label }}
                    </label>
                    <button type="button" (click)="moveWidget(w.id, -1)" class="cz-btn" title="Move up">↑</button>
                    <button type="button" (click)="moveWidget(w.id, 1)" class="cz-btn" title="Move down">↓</button>
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- Stat row (config-driven order + visibility) -->
        @if (visibleStats().length) {
          <div class="stat-row">
            @for (id of visibleStats(); track id) {
              @switch (id) {
                @case ('balance') { <ng-container *ngTemplateOutlet="tplBalance; context: { $implicit: d }"></ng-container> }
                @case ('todoToday') { <ng-container *ngTemplateOutlet="tplTodo; context: { $implicit: d }"></ng-container> }
                @case ('eventsWeek') { <ng-container *ngTemplateOutlet="tplEvents; context: { $implicit: d }"></ng-container> }
                @case ('bestStreak') { <ng-container *ngTemplateOutlet="tplStreak; context: { $implicit: d }"></ng-container> }
              }
            }
          </div>
        }

        <!-- Panels (config-driven order + visibility) -->
        <div class="panels">
          @for (id of visiblePanels(); track id) {
            @switch (id) {
              @case ('upcomingEvents') { <ng-container *ngTemplateOutlet="tplUpcoming; context: { $implicit: d }"></ng-container> }
              @case ('tasksInProgress') { <ng-container *ngTemplateOutlet="tplTasks; context: { $implicit: d }"></ng-container> }
              @case ('savingsPots') { <ng-container *ngTemplateOutlet="tplSavings; context: { $implicit: d }"></ng-container> }
              @case ('miniCalendar') { <ng-container *ngTemplateOutlet="tplCalendar; context: { $implicit: d }"></ng-container> }
              @case ('habitsToday') { <ng-container *ngTemplateOutlet="tplHabits; context: { $implicit: d }"></ng-container> }
              @case ('recentNotes') { <ng-container *ngTemplateOutlet="tplNotes; context: { $implicit: d }"></ng-container> }
            }
          }
        </div>

        <!-- ─── Widget templates ─── -->
        <ng-template #tplBalance let-d>
          <div class="stat-card">
            <div class="stat-top">
              <span class="uppercase-tag">Balance · {{ monthLabel() }}</span>
              <span>{{ d.stats.balance >= 0 ? '📈' : '📉' }}</span>
            </div>
            <div class="stat-value mono" [class.text-success]="d.stats.balance >= 0" [class.text-danger]="d.stats.balance < 0">
              {{ formatCurrency(d.stats.balance, d.stats.currency) }}
            </div>
            <div class="stat-sub mono">
              @if (d.stats.balanceDelta !== null) {
                {{ formatDelta(d.stats.balanceDelta, d.stats.currency) }} vs last month
              } @else {
                this month
              }
            </div>
          </div>
        </ng-template>

        <ng-template #tplTodo let-d>
          <div class="stat-card">
            <div class="stat-top">
              <span class="uppercase-tag">Tasks today</span>
              <span>🗂️</span>
            </div>
            <div class="stat-value mono text-primary">{{ d.stats.todoToday }}</div>
            <div class="stat-sub mono">{{ d.stats.todoHigh }} high priority</div>
          </div>
        </ng-template>

        <ng-template #tplEvents let-d>
          <div class="stat-card">
            <div class="stat-top">
              <span class="uppercase-tag">Events this week</span>
              <span>📅</span>
            </div>
            <div class="stat-value mono">{{ d.stats.eventsThisWeek }}</div>
            <div class="stat-sub mono truncate">{{ d.stats.nextEventLabel ?? 'nothing scheduled' }}</div>
          </div>
        </ng-template>

        <ng-template #tplStreak let-d>
          <div class="stat-card">
            <div class="stat-top">
              <span class="uppercase-tag">Best streak</span>
              <span>🔥</span>
            </div>
            <div class="stat-value mono" style="color: var(--color-accent)">{{ d.stats.bestStreak }}d</div>
            <div class="stat-sub mono truncate">{{ d.stats.bestStreakHabit ?? 'no habits yet' }}</div>
          </div>
        </ng-template>

        <ng-template #tplUpcoming let-d>
          <section class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">Upcoming events</div>
                <div class="panel-sub">Today → this week</div>
              </div>
              <a routerLink="/app/calendar" class="btn btn-sm btn-ghost">Open calendar →</a>
            </div>
            @if (d.upcomingEvents.length === 0) {
              <p class="empty">No upcoming events</p>
            } @else {
              @for (e of d.upcomingEvents; track e.id) {
                <a routerLink="/app/calendar" class="event-row panel-row">
                  <div class="event-when">
                    <div class="mono text-xs text-faint">{{ e.startDate | date: 'MMM dd' }}</div>
                    <div class="mono text-sm">{{ e.allDay ? 'all day' : (e.startDate | date: 'HH:mm') }}</div>
                  </div>
                  <div class="event-bar" [style.background]="e.color"></div>
                  <div class="min-w-0">
                    <div class="event-title">{{ e.title }}</div>
                    <div class="text-xs text-muted mono truncate">
                      {{ e.startDate | date: 'EEE' }}@if (e.location) { · 📍 {{ e.location }} }
                    </div>
                  </div>
                </a>
              }
            }
          </section>
        </ng-template>

        <ng-template #tplTasks let-d>
          <section class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">On your plate</div>
                <div class="panel-sub">{{ d.todosInProgress.length }} task(s) today</div>
              </div>
              <a routerLink="/app/todos" class="btn btn-sm btn-ghost">View board →</a>
            </div>
            @if (d.todosInProgress.length === 0) {
              <p class="empty">Nothing for today. Enjoy your day.</p>
            } @else {
              <div class="list-pad">
                @for (t of d.todosInProgress; track t.id) {
                  <div class="todo-row">
                    <span class="prio-dot" [style.background]="prioColor(t.priority)"></span>
                    <span class="flex-1 text-sm truncate">{{ t.title }}</span>
                    <span class="chip">{{ t.column.name }}</span>
                    @if (t.dueDate) {
                      <span class="mono text-xs text-faint shrink-0">{{ t.dueDate | date: 'HH:mm' }}</span>
                    }
                  </div>
                }
              </div>
            }
          </section>
        </ng-template>

        <ng-template #tplSavings let-d>
          @if (d.savingsPots.length > 0) {
            <section class="panel">
              <div class="panel-header">
                <div>
                  <div class="panel-title">Savings pots</div>
                  <div class="panel-sub">Your active goals</div>
                </div>
                <a routerLink="/app/finance/organizer" class="btn btn-sm btn-ghost">View goals →</a>
              </div>
              <div class="panel-pad">
                @for (p of d.savingsPots; track p.id) {
                  <div class="pot">
                    <div class="pot-head">
                      <span>{{ p.icon ?? '🎯' }}</span>
                      <span class="flex-1 text-sm font-medium truncate">{{ p.name }}</span>
                      <span class="mono text-xs font-semibold" [style.color]="p.color">{{ p.percent }}%</span>
                    </div>
                    <div class="bar">
                      <div class="bar-fill" [style.width.%]="p.percent" [style.background]="p.color"></div>
                    </div>
                    <div class="mono text-xs text-faint mt-1">
                      <strong class="text-muted">{{ formatCurrency(p.saved, d.stats.currency) }}</strong>
                      / {{ formatCurrency(p.goal, d.stats.currency) }}
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </ng-template>

        <ng-template #tplCalendar let-d>
          <section class="panel">
            <div class="panel-header">
              <div class="panel-title">{{ monthLabel() }} {{ year() }}</div>
            </div>
            <div class="panel-pad">
              <div class="cal-grid cal-dow">
                @for (dl of dowLabels; track $index) {
                  <div class="mono text-xs text-faint cal-dow-cell">{{ dl }}</div>
                }
              </div>
              <div class="cal-grid">
                @for (c of miniCells(); track $index) {
                  <div class="cal-cell" [class.cal-today]="c.isToday" [class.cal-empty]="!c.day">
                    {{ c.day ?? '' }}
                    @if (c.dots.length && !c.isToday) {
                      <div class="cal-dots">
                        @for (col of c.dots; track $index) {
                          <span class="cal-dot" [style.background]="col"></span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>
        </ng-template>

        <ng-template #tplHabits let-d>
          <section class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">Habits · today</div>
                <div class="panel-sub">{{ habitsDone(d) }}/{{ d.habitsToday.length }} done</div>
              </div>
              <a routerLink="/app/habits" class="btn btn-sm btn-ghost">View all →</a>
            </div>
            @if (d.habitsToday.length === 0) {
              <p class="empty">No habits yet</p>
            } @else {
              <div class="list-pad">
                @for (h of d.habitsToday; track h.id) {
                  <div class="habit-row">
                    <span class="habit-check" [class.done]="h.doneToday">
                      @if (h.doneToday) { ✓ }
                    </span>
                    <span class="flex-1 text-sm truncate">{{ h.icon ?? '🔁' }} {{ h.name }}</span>
                    <span class="mono text-xs text-muted shrink-0">{{ h.streak }}d</span>
                  </div>
                }
              </div>
            }
          </section>
        </ng-template>

        <ng-template #tplNotes let-d>
          <section class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">Recent notes</div>
                <div class="panel-sub">Latest activity</div>
              </div>
              <a routerLink="/app/notes" class="btn btn-sm btn-ghost">View all →</a>
            </div>
            @if (d.recentNotes.length === 0) {
              <p class="empty">No notes yet</p>
            } @else {
              <div class="list-pad">
                @for (n of d.recentNotes; track n.id) {
                  <a routerLink="/app/notes" [queryParams]="{ note: n.id }" class="note-row">
                    <span>{{ n.icon ?? '📝' }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium truncate">{{ n.title || 'Untitled' }}</div>
                      <div class="text-xs text-muted mono">{{ n.updatedAt | date: 'd MMM, HH:mm' }}</div>
                    </div>
                  </a>
                }
              </div>
            }
          </section>
        </ng-template>
      } @else if (loading()) {
        <p class="text-text-muted p-6">Loading…</p>
      } @else if (error()) {
        <p class="text-danger p-6">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px 80px; max-width: 1400px; margin: 0 auto; }
    @media (max-width: 640px) { .page { padding: 18px 16px 64px; } }

    .page-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .page-title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
    .page-subtitle { color: var(--color-text-muted); font-size: 13px; margin-top: 4px; }

    .stat-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px;
    }
    .stat-top { display: flex; justify-content: space-between; align-items: flex-start; font-size: 14px; }
    .stat-value { font-size: 26px; font-weight: 600; margin-top: 6px; letter-spacing: -0.02em; }
    .stat-sub { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }

    .panels { columns: 2; column-gap: 18px; }
    .panels .panel { break-inside: avoid; margin-bottom: 18px; }

    /* Customize panel */
    .cz { margin-bottom: 22px; }
    .cz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; padding: 4px 4px 8px; }
    .cz-head { margin-bottom: 6px; }
    .cz-row { display: flex; align-items: center; gap: 6px; padding: 3px 2px; }
    .cz-label { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
    .cz-btn {
      width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0;
      border: 1px solid var(--color-border); color: var(--color-text-muted);
      display: grid; place-items: center;
    }
    .cz-btn:hover { background: var(--color-surface-hover); }

    @media (max-width: 900px) {
      .stat-row { grid-template-columns: repeat(2, 1fr); }
      .panels { columns: 1; }
      .cz-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 420px) {
      .stat-row { grid-template-columns: 1fr; }
    }

    .empty { font-size: 13px; color: var(--color-text-muted); font-style: italic; padding: 16px 18px; }
    .list-pad { padding: 6px 8px 10px; }

    .text-muted { color: var(--color-text-muted); }
    .text-faint { color: var(--color-text-faint); }
    .text-success { color: var(--color-success); }
    .text-danger { color: var(--color-danger); }
    .text-primary { color: var(--color-primary); }

    /* Events */
    .event-row {
      display: grid; grid-template-columns: 56px 3px 1fr; align-items: center; gap: 14px;
      padding: 11px 18px; color: inherit; text-decoration: none;
      transition: background 100ms;
    }
    .event-row:hover { background: var(--color-surface-hover); }
    .event-when { text-align: left; }
    .event-bar { width: 3px; height: 30px; border-radius: 3px; }
    .event-title { font-size: 13px; font-weight: 500; }

    /* Todos */
    .todo-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; }
    .prio-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

    /* Savings */
    .pot { margin-bottom: 14px; }
    .pot:last-child { margin-bottom: 0; }
    .pot-head { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
    .bar { height: 5px; background: var(--color-surface-2); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

    /* Mini calendar */
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .cal-dow { margin-bottom: 6px; }
    .cal-dow-cell { text-align: center; padding: 4px 0; }
    .cal-cell {
      aspect-ratio: 1; border-radius: 4px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 12px; position: relative; color: var(--color-text);
    }
    .cal-empty { color: transparent; }
    .cal-today { background: var(--color-primary); color: #fff; font-weight: 600; }
    .cal-dots { position: absolute; bottom: 3px; display: flex; gap: 1px; }
    .cal-dot { width: 4px; height: 4px; border-radius: 50%; }

    /* Habits */
    .habit-row { display: flex; align-items: center; gap: 12px; padding: 7px 6px; }
    .habit-check {
      width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
      border: 1px solid var(--color-border);
      display: grid; place-items: center; font-size: 12px; color: #fff;
    }
    .habit-check.done { background: var(--color-success); border-color: transparent; }

    /* Notes */
    .note-row {
      display: flex; align-items: flex-start; gap: 10px; padding: 7px 6px;
      color: inherit; text-decoration: none; border-radius: var(--radius-sm);
      transition: background 100ms;
    }
    .note-row:hover { background: var(--color-surface-hover); }

    .mt-1 { margin-top: 4px; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 13px; }
    .flex { display: flex; }
    .flex-1 { flex: 1; }
    .gap-2 { gap: 8px; }
    .shrink-0 { flex-shrink: 0; }
    .min-w-0 { min-width: 0; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly dowLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // ─── Customizable layout ───────────────────────────────
  protected readonly widgets = signal<DashboardWidgetPref[]>(resolveDashboardWidgets(null));
  protected readonly customizeOpen = signal(false);
  private readonly widgetKind = new Map(DASHBOARD_WIDGETS.map((w) => [w.id, w.kind]));
  private readonly widgetLabel = new Map(DASHBOARD_WIDGETS.map((w) => [w.id, w.label]));

  protected readonly visibleStats = computed(() =>
    this.widgets().filter((w) => w.visible && this.widgetKind.get(w.id) === 'stat').map((w) => w.id),
  );
  protected readonly visiblePanels = computed(() =>
    this.widgets().filter((w) => w.visible && this.widgetKind.get(w.id) === 'panel').map((w) => w.id),
  );
  protected readonly statRows = computed(() =>
    this.widgets()
      .filter((w) => this.widgetKind.get(w.id) === 'stat')
      .map((w) => ({ ...w, label: this.widgetLabel.get(w.id) ?? w.id })),
  );
  protected readonly panelRows = computed(() =>
    this.widgets()
      .filter((w) => this.widgetKind.get(w.id) === 'panel')
      .map((w) => ({ ...w, label: this.widgetLabel.get(w.id) ?? w.id })),
  );

  protected readonly greeting = computed(() => {
    const u = this.auth.user();
    const name = u?.displayName ?? u?.email?.split('@')[0] ?? null;
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening';
    return name ? `${part}, ${name}.` : `${part}.`;
  });

  protected readonly today = computed(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  protected readonly monthLabel = computed(() =>
    new Date().toLocaleDateString('en-US', { month: 'long' }),
  );

  protected readonly year = computed(() => new Date().getFullYear());

  protected readonly miniCells = computed<MiniCell[]>(() => {
    const d = this.data();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();

    const dotsByDay = new Map<number, string[]>();
    for (const e of d?.monthEvents ?? []) {
      const arr = dotsByDay.get(e.day) ?? [];
      if (arr.length < 3) arr.push(e.color);
      dotsByDay.set(e.day, arr);
    }

    const cells: MiniCell[] = [];
    for (let i = 0; i < 42; i++) {
      const day = i - startDow + 1;
      const valid = day >= 1 && day <= daysInMonth;
      cells.push({
        day: valid ? day : null,
        isToday: valid && day === todayDate,
        dots: valid ? dotsByDay.get(day) ?? [] : [],
      });
    }
    return cells;
  });

  ngOnInit(): void {
    this.dashboard.load().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load the dashboard');
      },
    });
    this.dashboard.loadConfig().subscribe({
      next: (cfg) => this.widgets.set(resolveDashboardWidgets(cfg)),
      error: () => undefined, // keep defaults on failure
    });
  }

  protected toggleCustomize(): void {
    this.customizeOpen.update((v) => !v);
  }

  protected toggleWidget(id: string): void {
    this.widgets.update((ws) => ws.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
    this.persistConfig();
  }

  /** Move a widget up/down among its OWN kind (stats stay with stats, panels with panels). */
  protected moveWidget(id: string, delta: number): void {
    const ws = [...this.widgets()];
    const i = ws.findIndex((w) => w.id === id);
    if (i < 0) return;
    const kind = this.widgetKind.get(id);
    let j = i + delta;
    while (j >= 0 && j < ws.length && this.widgetKind.get(ws[j].id) !== kind) j += delta;
    if (j < 0 || j >= ws.length) return;
    [ws[i], ws[j]] = [ws[j], ws[i]];
    this.widgets.set(ws);
    this.persistConfig();
  }

  protected resetWidgets(): void {
    this.widgets.set(resolveDashboardWidgets(null));
    this.persistConfig();
  }

  private persistConfig(): void {
    this.dashboard.saveConfig(this.widgets()).subscribe({ error: () => undefined });
  }

  protected subtitle(d: DashboardData): string {
    const parts: string[] = [];
    parts.push(`${d.stats.eventsThisWeek} event(s) this week`);
    parts.push(`${d.stats.todoToday} task(s) today`);
    if (d.stats.bestStreak > 0 && d.stats.bestStreakHabit) {
      parts.push(`${d.stats.bestStreak}-day ${d.stats.bestStreakHabit} streak`);
    }
    return parts.join(' · ');
  }

  protected habitsDone(d: DashboardData): number {
    return d.habitsToday.filter((h) => h.doneToday).length;
  }

  protected prioColor(p: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): string {
    if (p === 'HIGH' || p === 'URGENT') return 'var(--color-danger)';
    if (p === 'MEDIUM') return 'var(--color-accent)';
    return 'var(--color-text-faint)';
  }

  protected formatCurrency(value: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(0)}`;
    }
  }

  protected formatDelta(value: number, currency: string): string {
    return (value >= 0 ? '+' : '') + this.formatCurrency(value, currency);
  }
}
