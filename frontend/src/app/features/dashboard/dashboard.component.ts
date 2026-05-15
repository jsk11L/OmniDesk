import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

interface QuickLink {
  path: string;
  label: string;
  emoji: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-semibold mb-1">
          Hola{{ greeting() }}
        </h1>
        <p class="text-text-muted">
          Bienvenido a tu organizador personal. Empieza por cualquiera de los módulos.
        </p>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (link of quickLinks; track link.path) {
          <a
            [routerLink]="link.path"
            class="block p-5 bg-surface border border-border rounded hover:bg-surface-hover hover:border-primary transition-colors"
          >
            <div class="text-2xl mb-2">{{ link.emoji }}</div>
            <h2 class="font-medium mb-1">{{ link.label }}</h2>
            <p class="text-sm text-text-muted">{{ link.description }}</p>
          </a>
        }
      </div>

      <div class="mt-8 p-4 border border-dashed border-border rounded text-sm text-text-muted">
        Atajo: <kbd class="px-1.5 py-0.5 bg-surface-hover rounded text-xs">Ctrl + K</kbd> para abrir
        la paleta de comandos.
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);

  protected readonly greeting = computed(() => {
    const user = this.auth.user();
    if (user?.displayName) return `, ${user.displayName}`;
    if (user?.email) return `, ${user.email}`;
    return '';
  });

  protected readonly quickLinks: QuickLink[] = [
    {
      path: '/calendar',
      label: 'Calendario',
      emoji: '📅',
      description: 'Eventos, recordatorios y vista mensual/semanal',
    },
    {
      path: '/lists',
      label: 'Listas',
      emoji: '📚',
      description: 'Bibliotecas personalizadas: juegos, libros, música…',
    },
    {
      path: '/notes',
      label: 'Notas',
      emoji: '📝',
      description: 'Editor rich text con auto-save',
    },
    {
      path: '/todos',
      label: 'TO-DO',
      emoji: '✅',
      description: 'Tablero Kanban con drag & drop',
    },
    {
      path: '/finance',
      label: 'Finanzas',
      emoji: '💰',
      description: 'Ingresos, gastos, presupuestos y gráficos',
    },
    {
      path: '/notifications',
      label: 'Notificaciones',
      emoji: '🔔',
      description: 'In-app, push del navegador y email',
    },
  ];
}
