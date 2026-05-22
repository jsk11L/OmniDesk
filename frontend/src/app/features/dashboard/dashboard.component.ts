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
    <div class="p-6 max-w-7xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold mb-1">Hola{{ greeting() }}</h1>
        <p class="text-text-muted text-sm">Tu día a la vista.</p>
      </header>

      @if (data(); as d) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Próximo evento -->
          <a routerLink="/app/calendar" class="widget">
            <header class="widget-header">
              <span class="widget-icon">📅</span>
              <h2>Próximo evento</h2>
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
              <p class="empty">No tienes eventos próximos</p>
            }
          </a>

          <!-- TO-DOs de hoy -->
          <a routerLink="/app/todos" class="widget">
            <header class="widget-header">
              <span class="widget-icon">✓</span>
              <h2>Tareas de hoy</h2>
            </header>
            <div class="widget-body">
              @if (d.todayTodos.pending.length === 0 && d.todayTodos.completed.length === 0 && !d.todayTodos.extraNoDate) {
                <p class="empty">Nada para hoy. Disfruta el día.</p>
              } @else {
                @if (d.todayTodos.pending.length) {
                  <p class="section-title">Pendientes ({{ d.todayTodos.pending.length }})</p>
                  <ul class="todo-list">
                    @for (t of d.todayTodos.pending.slice(0, 4); track t.id) {
                      <li>
                        <span class="circle"></span>
                        <span [class.priority-high]="t.priority === 'HIGH' || t.priority === 'URGENT'">
                          {{ t.title }}
                        </span>
                      </li>
                    }
                  </ul>
                }
                @if (d.todayTodos.completed.length) {
                  <p class="section-title mt-2">Hechas ({{ d.todayTodos.completed.length }})</p>
                  <ul class="todo-list completed">
                    @for (t of d.todayTodos.completed.slice(0, 2); track t.id) {
                      <li>✓ <s>{{ t.title }}</s></li>
                    }
                  </ul>
                }
                @if (d.todayTodos.extraNoDate; as e) {
                  <p class="section-title mt-2">Sin fecha</p>
                  <p class="todo-extra">○ {{ e.title }}</p>
                }
              }
            </div>
          </a>

          <!-- Última nota -->
          <a routerLink="/app/notes" class="widget">
            <header class="widget-header">
              <span class="widget-icon">📝</span>
              <h2>Última nota</h2>
            </header>
            @if (d.latestNote; as n) {
              <div class="widget-body">
                <p class="title-line">
                  @if (n.icon) { <span>{{ n.icon }}</span> }
                  <strong>{{ n.title || 'Sin título' }}</strong>
                </p>
                <p class="meta">Actualizada {{ n.updatedAt | date:'d MMM, HH:mm' }}</p>
                @if (n.tags.length) {
                  <div class="tags">
                    @for (t of n.tags.slice(0, 4); track t) {
                      <span class="tag">{{ t }}</span>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="empty">Aún no hay notas</p>
            }
          </a>

          <!-- Pr. meta financiera -->
          <a routerLink="/app/finance" class="widget">
            <header class="widget-header">
              <span class="widget-icon">💰</span>
              <h2>Tu presupuesto</h2>
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
                <p class="meta">{{ g.percent }}% usado</p>
              </div>
            } @else {
              <p class="empty">Sin metas configuradas</p>
            }
          </a>
        </div>

        <!-- Item aleatorio -->
        <a
          class="widget mt-4 random-item"
          [routerLink]="d.randomItem ? ['/app/lists', d.randomItem.list.id] : null"
        >
          <header class="widget-header">
            <span class="widget-icon">🎲</span>
            <h2>Descubre algo de tus colecciones</h2>
          </header>
          @if (d.randomItem; as r) {
            <div class="random-content">
              @if (r.item.imageUrl) {
                <img [src]="resolveImg(r.item.imageUrl)" alt="" class="random-img" />
              } @else {
                <div class="random-img placeholder">{{ r.list.icon ?? '📚' }}</div>
              }
              <div>
                <p class="meta">En lista <strong>{{ r.list.name }}</strong></p>
                <p class="title-line"><strong>{{ r.item.title }}</strong></p>
              </div>
            </div>
          } @else {
            <p class="empty">Crea tu primera lista para ver items aleatorios aquí.</p>
          }
        </a>
      } @else if (loading()) {
        <p class="text-text-muted">Cargando…</p>
      } @else if (error()) {
        <p class="text-danger">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .widget {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      transition: border-color 0.15s, transform 0.15s;
      color: inherit;
      text-decoration: none;
    }
    .widget:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
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
      align-items: center;
      gap: 0.5rem;
    }
    .todo-list.completed { color: var(--color-text-muted); }
    .circle {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid var(--color-text-muted);
      display: inline-block;
    }
    .priority-high { color: var(--color-danger); }
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
        this.error.set('No se pudo cargar el dashboard');
      },
    });
  }

  protected resolveImg(url: string | null): string | null {
    return this.uploads.resolveUrl(url);
  }
}
