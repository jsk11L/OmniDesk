import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
        (click)="close()"
      >
        <div
          class="w-full max-w-xl bg-surface border border-border rounded shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <input
            type="text"
            [(ngModel)]="query"
            placeholder="Escribe un comando o búsqueda…"
            class="w-full px-4 py-3 bg-transparent text-text placeholder:text-text-muted outline-none border-b border-border"
            #searchInput
            autofocus
          />
          <div class="p-4 text-sm text-text-muted">
            <p class="mb-2">Atajos disponibles:</p>
            <ul class="space-y-1 text-xs">
              <li><kbd class="px-1.5 py-0.5 bg-surface-hover rounded">Ctrl + K</kbd> &nbsp;Abrir / cerrar paleta</li>
              <li><kbd class="px-1.5 py-0.5 bg-surface-hover rounded">Esc</kbd> &nbsp;Cerrar</li>
            </ul>
            <p class="mt-4 italic">Búsqueda global y comandos completos se habilitan en Fase 5+.</p>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  protected readonly open = signal(false);
  protected query = '';

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.update((v) => !v);
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  close(): void {
    this.open.set(false);
    this.query = '';
  }
}
