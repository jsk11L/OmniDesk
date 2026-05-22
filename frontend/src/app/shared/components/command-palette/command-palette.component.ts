import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/65 backdrop-blur-sm"
        (click)="close()"
      >
        <div
          class="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="input-wrap relative border-b border-border">
            <span class="suggestion-overlay">{{ suggestionText() }}</span>
            <input
              type="text"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange()"
              (keydown)="onKey($event)"
              placeholder="Escribe un comando o búsqueda…"
              class="relative z-10 w-full px-4 py-3 bg-transparent text-text placeholder:text-text-muted outline-none"
              autofocus
            />
          </div>

          <ul class="max-h-[50vh] overflow-y-auto py-2">
            @if (filtered().length === 0) {
              <li class="px-4 py-3 text-sm text-text-muted text-center">Sin resultados</li>
            } @else {
              @for (cmd of filtered(); track cmd.id; let i = $index) {
                <li
                  (click)="execute(cmd)"
                  (mouseenter)="setIndex(i)"
                  [class]="
                    'px-4 py-2 flex items-center justify-between cursor-pointer text-sm transition-colors ' +
                    (i === selectedIndex() ? 'bg-surface-hover' : '')
                  "
                >
                  <div class="flex flex-col">
                    <span>{{ cmd.label }}</span>
                    <span class="text-xs text-text-muted">{{ cmd.category }}</span>
                  </div>
                  @if (cmd.shortcut) {
                    <kbd class="px-1.5 py-0.5 bg-background border border-border rounded text-xs">{{ cmd.shortcut }}</kbd>
                  }
                </li>
              }
            }
          </ul>

          <div class="border-t border-border px-4 py-2 text-xs text-text-muted flex justify-between">
            <span>↑↓ navegar · ↵ ejecutar · Tab aceptar · Esc cerrar</span>
            <span>{{ filtered().length }} de {{ allCommands.length }}</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .input-wrap { position: relative; }
    .suggestion-overlay {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      pointer-events: none;
      white-space: pre;
      font-size: inherit;
      opacity: 0.4;
    }
  `],
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);

  protected readonly open = signal(false);
  protected query = '';
  protected readonly selectedIndex = signal(0);
  protected readonly queryReactive = signal('');

  protected readonly allCommands: Command[] = [
    { id: 'nav-dashboard', label: 'Ir a Dashboard', category: 'Navegación', shortcut: 'G D', action: () => this.go('/app') },
    { id: 'nav-calendar', label: 'Ir a Calendario', category: 'Navegación', shortcut: 'G C', action: () => this.go('/app/calendar') },
    { id: 'nav-lists', label: 'Ir a Listas', category: 'Navegación', shortcut: 'G L', action: () => this.go('/app/lists') },
    { id: 'nav-notes', label: 'Ir a Notas', category: 'Navegación', shortcut: 'G N', action: () => this.go('/app/notes') },
    { id: 'nav-todos', label: 'Ir a TO-DO', category: 'Navegación', shortcut: 'G T', action: () => this.go('/app/todos') },
    { id: 'nav-habits', label: 'Ir a Hábitos', category: 'Navegación', shortcut: 'G H', action: () => this.go('/app/habits') },
    { id: 'nav-finance', label: 'Ir a Finanzas', category: 'Navegación', shortcut: 'G F', action: () => this.go('/app/finance') },
    { id: 'nav-notifications', label: 'Ir a Notificaciones', category: 'Navegación', action: () => this.go('/app/notifications') },
    { id: 'nav-settings', label: 'Ir a Ajustes', category: 'Navegación', shortcut: 'G S', action: () => this.go('/app/settings') },
    { id: 'create-event', label: 'Nuevo Evento', category: 'Crear', action: () => this.go('/app/calendar') },
    { id: 'create-note', label: 'Nueva Nota', category: 'Crear', action: () => this.go('/app/notes') },
    { id: 'create-list', label: 'Nueva Lista', category: 'Crear', action: () => this.go('/app/lists') },
    { id: 'create-todo', label: 'Nueva Tarea', category: 'Crear', action: () => this.go('/app/todos') },
    { id: 'create-habit', label: 'Nuevo Hábito', category: 'Crear', action: () => this.go('/app/habits') },
    { id: 'create-wishlist', label: 'Nuevo Deseo (Wishlist)', category: 'Crear', action: () => this.go('/app/finance') },
    { id: 'create-saving', label: 'Nueva Meta de Ahorro', category: 'Crear', action: () => this.go('/app/finance') },
  ];

  protected readonly filtered = computed<Command[]>(() => {
    const q = this.queryReactive().trim().toLowerCase();
    if (!q) return this.allCommands;
    const tokens = q.split(/\s+/);
    return this.allCommands
      .map((cmd) => ({ cmd, score: this.fuzzyScore(cmd, tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd);
  });

  protected readonly suggestionText = computed<string>(() => {
    const q = this.queryReactive();
    if (!q) return '';
    const first = this.filtered()[0];
    if (!first) return '';
    if (first.label.toLowerCase().startsWith(q.toLowerCase())) {
      return q + first.label.slice(q.length);
    }
    return '';
  });

  private fuzzyScore(cmd: Command, tokens: string[]): number {
    const haystack = `${cmd.label} ${cmd.category}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 10;
      } else {
        let i = 0;
        let matched = 0;
        for (const ch of token) {
          const idx = haystack.indexOf(ch, i);
          if (idx === -1) return 0;
          matched++;
          i = idx + 1;
        }
        score += matched;
      }
      if (cmd.label.toLowerCase().startsWith(token)) score += 20;
    }
    return score;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.update((v) => !v);
      if (this.open()) this.reset();
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  protected onKey(event: KeyboardEvent): void {
    const total = this.filtered().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update((i) => (i + 1) % Math.max(1, total));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update((i) => (i - 1 + total) % Math.max(1, total));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.filtered()[this.selectedIndex()];
      if (cmd) this.execute(cmd);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const first = this.filtered()[0];
      if (first) {
        this.query = first.label;
        this.queryReactive.set(first.label);
      }
    }
  }

  protected onQueryChange(): void {
    this.queryReactive.set(this.query);
    this.selectedIndex.set(0);
  }

  protected setIndex(i: number): void {
    this.selectedIndex.set(i);
  }

  protected execute(cmd: Command): void {
    cmd.action();
    this.close();
  }

  private go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  protected close(): void {
    this.open.set(false);
    this.reset();
  }

  private reset(): void {
    this.query = '';
    this.queryReactive.set('');
    this.selectedIndex.set(0);
  }
}
