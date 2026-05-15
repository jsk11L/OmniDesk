import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ThemeEditorComponent } from '../theme-editor/theme-editor.component';
import { ProfileSettingsComponent } from '../profile-settings/profile-settings.component';

type Tab = 'theme' | 'profile';

@Component({
  selector: 'app-settings-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ThemeEditorComponent, ProfileSettingsComponent],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <h1 class="text-2xl font-semibold mb-3">Ajustes</h1>
        <nav class="flex gap-2">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              (click)="active.set(t.id)"
              [class]="
                'px-3 py-1.5 rounded text-sm transition-colors ' +
                (active() === t.id
                  ? 'bg-surface-hover text-text'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover')
              "
            >
              {{ t.label }}
            </button>
          }
        </nav>
      </header>

      <div class="flex-1 overflow-auto p-6">
        @switch (active()) {
          @case ('theme') {
            <app-theme-editor />
          }
          @case ('profile') {
            <app-profile-settings />
          }
        }
      </div>
    </div>
  `,
})
export class SettingsHomeComponent {
  protected readonly active = signal<Tab>('theme');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'theme', label: 'Apariencia / Temas' },
    { id: 'profile', label: 'Perfil' },
  ];
}
