import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { UploadsService } from '../../shared/services/uploads.service';
import { DashboardService } from './dashboard.service';
import type { DashboardData } from './dashboard.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="p-4 sm:p-6 max-w-7xl mx-auto">
      <header class="mb-6">
        <h1 class="text-xl sm:text-2xl font-semibold mb-1">Hi{{ greeting() }}</h1>
        <p class="text-text-muted text-sm">Your day at a glance.</p>
      </header>

      @if (data(); as d) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <!-- Next event -->
          <a routerLink="/app/calendar" class="widget">
            <header class="widget-header">
              <span class="widget-icon">📅</span>
              <h2>Next event</h2>
            </header>
            @if (d.nextEvent; as e) {
              <div class="widget-body">
                <p class="title-line">
                  <span class="dot" [style.background-color]="e.color"></span>
                  <strong>{{ e.title }}</strong>
                </p>
                <p class="meta">{{ e.startDate | date:'EEEE d MMM, HH:mm' }}</p>
                @if (e.location) { <p class="meta">📍 {{ e.location }}</p> }
              </div>
            } @else {
              <p class="empty">No upcoming events</p>
            }
          </a>

          <!-- Today's TO-DOs -->
          <a routerLink="/app/todos" class="widget">
            <header class="widget-header">
              <span class="widget-icon">✓</span>
              <h2>Today's tasks</h2>
            </header>
            <div class="widget-body">
              @if (d.todayTodos.pending.length === 0 && d.todayTodos.completed.length === 0 && !d.todayTodos.extraNoDate) {
                <p class="empty">Nothing for today. Enjoy your day.</p>
              } @else {
                @if (d.todayTodos.pending.length) {
                  <p class="section-title">Pending ({{ d.todayTodos.pending.length }})</p>
                  <ul class="todo-list">
                    @for (t of d.todayTodos.pending.slice(0, 4); track t.id) {
                      <li>
                        <span class="circle"></span>
                        <span class="todo-text">
                          <span
                            class="todo-title"
                            [class.priority-high]="t.priority === 'HIGH' || t.priority === 'URGENT'"
                          >
                            {{ t.title }}
                          </span>
                          <span class="todo-meta">
                            <span class="todo-chip">{{ t.column.name }}</span>
                            @if (t.dueDate) {
                              <span class="todo-due">⏰ {{ t.dueDate | date: 'HH:mm' }}</span>
                            }
                            @if (t.priority === 'HIGH' || t.priority === 'URGENT') {
                              <span class="todo-prio">{{ t.priority }}</span>
                            }
                          </span>
                        </span>
                      </li>
                    }
                  </ul>
                }
                @if (d.todayTodos.completed.length) {
                  <p class="section-title mt-2">Done ({{ d.todayTodos.completed.length }})</p>
                  <ul class="todo-list completed">
                    @for (t of d.todayTodos.completed.slice(0, 2); track t.id) {
                      <li>✓ <s>{{ t.title }}</s></li>
                    }
                  </ul>
                }
                @if (d.todayTodos.extraNoDate; as e) {
                  <p class="section-title mt-2">No date</p>
                  <p class="todo-extra">○ {{ e.title }}</p>
                }
              }
            </div>
          </a>

          <!-- Latest note -->
          <a
            routerLink="/app/notes"
            [queryParams]="d.latestNote ? { note: d.latestNote.id } : null"
            class="widget"
          >
            <header class="widget-header">
              <span class="widget-icon">📝</span>
              <h2>Latest note</h2>
            </header>
            @if (d.latestNote; as n) {
              <div class="widget-body">
                <p class="title-line">
                  @if (n.icon) { <span>{{ n.icon }}</span> }
                  <strong>{{ n.title || 'Untitled' }}</strong>
                </p>
                <p class="meta">Updated {{ n.updatedAt | date:'d MMM, HH:mm' }}</p>
                @if (n.tags.length) {
                  <div class="tags">
                    @for (t of n.tags.slice(0, 4); track t) {
                      <span class="tag">{{ t }}</span>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="empty">No notes yet</p>
            }
          </a>

          <!-- Next finance goal -->
          <a routerLink="/app/finance" class="widget">
            <header class="widget-header">
              <span class="widget-icon">💰</span>
              <h2>Your budget</h2>
            </header>
            @if (d.nextFinanceGoal; as g) {
              <div class="widget-body">
                <p class="title-line"><strong>{{ g.name }}</strong></p>
                <p class="meta">
                  {{ g.current | number:'1.0-2' }} / {{ g.target | number:'1.0-2' }}
                </p>
                <div class="progress">
                  <div class="progress-fill" [style.width.%]="g.percent"
                       [class.over]="g.percent >= 100"></div>
                </div>
                <p class="meta">{{ g.percent }}% used</p>
              </div>
            } @else {
              <p class="empty">No goals configured</p>
            }
          </a>
        </div>

        <!-- Random item -->
        <a
          class="widget mt-4 random-item"
          [routerLink]="d.randomItem ? ['/app/lists', d.randomItem.list.id] : null"
        >
          <header class="widget-header">
            <span class="widget-icon">🎲</span>
            <h2>Discover something from your collections</h2>
          </header>
          @if (d.randomItem; as r) {
            <div class="random-content">
              @if (r.item.imageUrl) {
                <img [src]="resolveImg(r.item.imageUrl)" alt="" class="random-img" />
              } @else {
                <div class="random-img placeholder">{{ r.list.icon ?? '📚' }}</div>
              }
              <div>
                <p class="meta">In list <strong>{{ r.list.name }}</strong></p>
                <p class="title-line"><strong>{{ r.item.title }}</strong></p>
              </div>
            </div>
          } @else {
            <p class="empty">Create your first list to see random items here.</p>
          }
        </a>
      } @else if (loading()) {
        <p class="text-text-muted">Loading…</p>
      } @else if (error()) {
        <p class="text-danger">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .widget {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
      color: inherit;
      text-decoration: none;
    }
    .widget:hover {
      border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .widget-icon { font-size: 1.125rem; }
    .widget-header h2 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .widget-body { display: flex; flex-direction: column; gap: 0.25rem; }
    .title-line { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
    .title-line strong { font-weight: 600; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .meta { font-size: 0.8125rem; color: var(--color-text-muted); }
    .empty { font-size: 0.875rem; color: var(--color-text-muted); font-style: italic; }
    .section-title {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .mt-2 { margin-top: 0.5rem; }
    .todo-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .todo-list li {
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .todo-list.completed li { align-items: center; }
    .todo-list.completed { color: var(--color-text-muted); }
    .circle {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid var(--color-text-muted);
      display: inline-block;
      margin-top: 0.3rem;
      flex-shrink: 0;
    }
    .priority-high { color: var(--color-danger); }
    .todo-text { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
    .todo-title { line-height: 1.3; }
    .todo-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }
    .todo-chip {
      padding: 0.05rem 0.4rem;
      border-radius: 999px;
      background: var(--color-background);
      border: 1px solid var(--color-border);
    }
    .todo-due { white-space: nowrap; }
    .todo-prio {
      padding: 0.05rem 0.4rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-danger) 18%, transparent);
      color: var(--color-danger);
      font-weight: 600;
    }
    .todo-extra { font-size: 0.875rem; color: var(--color-text-muted); }
    .tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .tag {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      background: var(--color-surface-hover);
      border-radius: 999px;
    }
    .progress {
      width: 100%;
      height: 6px;
      background: var(--color-surface-hover);
      border-radius: 999px;
      overflow: hidden;
      margin: 0.5rem 0;
    }
    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.3s;
    }
    .progress-fill.over { background: var(--color-danger); }
    .random-item.widget { padding: 1rem 1.25rem; }
    .random-content { display: flex; gap: 1rem; align-items: center; }
    .random-img {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .random-img.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface-hover);
      font-size: 1.5rem;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  private readonly uploads = inject(UploadsService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly greeting = computed(() => {
    const u = this.auth.user();
    if (u?.displayName) return `, ${u.displayName}`;
    if (u?.email) return `, ${u.email.split('@')[0]}`;
    return '';
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
  }

  protected resolveImg(url: string | null): string | null {
    return this.uploads.resolveUrl(url);
  }
}
