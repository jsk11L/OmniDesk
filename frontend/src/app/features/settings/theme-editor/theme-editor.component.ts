import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '../../../shared/services/dialog.service';
import { HttpErrorResponse } from '@angular/common/http';

import { ThemeService } from '../../../core/services/theme.service';
import { SettingsService } from '../services/settings.service';
import type { Theme } from '../../../core/models/theme.model';

const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'Geist', sans-serif", label: 'Geist' },
];

const RADIUS_OPTIONS = [
  { value: '0', label: 'Sharp (0)' },
  { value: '0.5rem', label: 'Soft (0.5rem)' },
  { value: '1rem', label: 'Round (1rem)' },
];

const COLOR_KEYS: (keyof Theme)[] = [
  'colorPrimary',
  'colorSecondary',
  'colorBackground',
  'colorSurface',
  'colorSurfaceHover',
  'colorBorder',
  'colorText',
  'colorTextMuted',
  'colorAccent',
  'colorDanger',
  'colorSuccess',
];

const COLOR_LABELS: Record<string, string> = {
  colorPrimary: 'Primario',
  colorSecondary: 'Secundario',
  colorBackground: 'Fondo',
  colorSurface: 'Superficie',
  colorSurfaceHover: 'Superficie hover',
  colorBorder: 'Borde',
  colorText: 'Texto',
  colorTextMuted: 'Texto atenuado',
  colorAccent: 'Acento',
  colorDanger: 'Peligro',
  colorSuccess: 'Éxito',
};

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <aside class="lg:col-span-1">
        <h2 class="text-sm font-medium mb-3">Mis temas</h2>
        <ul class="space-y-1">
          @for (t of themes(); track t.id) {
            <li>
              <button
                type="button"
                (click)="select(t)"
                [class]="
                  'w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded text-sm transition-colors ' +
                  (current()?.id === t.id
                    ? 'bg-surface-hover'
                    : 'hover:bg-surface-hover')
                "
              >
                <span class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full inline-block"
                    [style.background-color]="t.colorPrimary"
                  ></span>
                  {{ t.name }}
                </span>
                @if (t.isDefault) {
                  <span class="text-xs text-text-muted">sistema</span>
                }
                @if (activeThemeId() === t.id) {
                  <span class="text-xs text-accent">★</span>
                }
              </button>
            </li>
          }
        </ul>
      </aside>

      <section class="lg:col-span-2">
        @if (current(); as t) {
          <div class="flex items-center justify-between mb-4">
            <input
              type="text"
              [(ngModel)]="editName"
              [disabled]="t.isDefault"
              class="text-xl font-semibold bg-transparent outline-none border-b border-border focus:border-primary px-1"
            />
            <div class="flex gap-2">
              @if (activeThemeId() !== t.id) {
                <button
                  type="button"
                  (click)="activate(t)"
                  class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90"
                >
                  Activar
                </button>
              }
              @if (!t.isDefault) {
                <button
                  type="button"
                  (click)="updateCurrent()"
                  [disabled]="saving()"
                  class="px-3 py-1.5 text-sm rounded hover:bg-surface-hover"
                >
                  {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
                </button>
                <button
                  type="button"
                  (click)="deleteCurrent()"
                  class="px-3 py-1.5 text-sm rounded text-danger hover:bg-danger/10"
                >
                  Eliminar
                </button>
              }
              <button
                type="button"
                (click)="saveAsNew()"
                [disabled]="saving()"
                class="px-3 py-1.5 text-sm rounded bg-surface-hover hover:opacity-90"
              >
                Guardar como nuevo
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            @for (key of colorKeys; track key) {
              <label class="flex items-center justify-between gap-3 bg-surface border border-border rounded px-3 py-2">
                <span class="text-sm">{{ colorLabel(key) }}</span>
                <span class="flex items-center gap-2">
                  <input
                    type="color"
                    [ngModel]="editValues()[key]"
                    (ngModelChange)="updateValue(key, $event)"
                    class="w-8 h-8 bg-background border border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    [ngModel]="editValues()[key]"
                    (ngModelChange)="updateValue(key, $event)"
                    class="w-20 px-2 py-1 bg-background border border-border rounded text-xs font-mono outline-none focus:border-primary"
                  />
                </span>
              </label>
            }
          </div>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Familia tipográfica</span>
              <select
                [ngModel]="editValues()['fontFamily']"
                (ngModelChange)="updateValue('fontFamily', $event)"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              >
                @for (opt of fontOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </label>
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Border radius</span>
              <select
                [ngModel]="editValues()['borderRadius']"
                (ngModelChange)="updateValue('borderRadius', $event)"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              >
                @for (opt of radiusOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm col-span-2">
              <input
                type="checkbox"
                [ngModel]="editValues()['isDark']"
                (ngModelChange)="updateValue('isDark', $event)"
                class="accent-primary"
              />
              <span>Modo oscuro</span>
            </label>
          </div>

          <div class="bg-surface border border-border rounded p-4">
            <h3 class="text-sm font-medium mb-3">Preview</h3>
            <div class="space-y-2">
              <button type="button" class="px-4 py-2 rounded bg-primary text-white text-sm">
                Botón primario
              </button>
              <button type="button" class="px-4 py-2 rounded bg-surface-hover text-sm border border-border">
                Botón secundario
              </button>
              <p class="text-sm">
                Texto normal y
                <a href="#" class="text-accent hover:underline">link</a>.
              </p>
              <p class="text-xs text-text-muted">Texto atenuado para descripciones.</p>
            </div>
          </div>
        } @else {
          <p class="text-text-muted">Selecciona un tema para editar.</p>
        }
      </section>
    </div>
  `,
})
export class ThemeEditorComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly settings = inject(SettingsService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly themes = this.themeService.themes;
  protected readonly activeThemeId = computed(() => this.themeService.activeTheme()?.id ?? null);

  protected readonly current = signal<Theme | null>(null);
  protected readonly editValues = signal<Record<string, string | boolean>>({});
  protected readonly saving = signal(false);
  protected editName = '';

  protected readonly colorKeys = COLOR_KEYS;
  protected readonly fontOptions = FONT_OPTIONS;
  protected readonly radiusOptions = RADIUS_OPTIONS;

  ngOnInit(): void {
    this.themeService.loadThemes().subscribe({
      next: (themes) => {
        const active = this.activeThemeId();
        const initial = themes.find((t) => t.id === active) ?? themes[0];
        if (initial) this.select(initial);
      },
    });
  }

  protected colorLabel(key: string): string {
    return COLOR_LABELS[key] ?? key;
  }

  protected select(theme: Theme): void {
    this.current.set(theme);
    this.editName = theme.name;
    this.editValues.set({ ...theme });
  }

  protected updateValue(key: string, value: string | boolean): void {
    this.editValues.update((v) => ({ ...v, [key]: value }));
    const preview = { ...(this.current() as Theme), ...this.editValues() } as Theme;
    this.themeService.applyTheme(preview);
  }

  protected activate(theme: Theme): void {
    this.themeService.activate(theme.id).subscribe({
      next: () => this.toastr.success(`Tema "${theme.name}" activado`),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected updateCurrent(): void {
    const t = this.current();
    if (!t || t.isDefault) return;
    this.saving.set(true);
    const payload = { ...this.buildPayload(), name: this.editName.trim() || t.name };
    this.settings.updateTheme(t.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastr.success('Tema actualizado');
        this.themeService.loadThemes().subscribe();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected saveAsNew(): void {
    const t = this.current();
    if (!t) return;
    const baseName = this.editName.trim() || `${t.name} copia`;
    const name = t.isDefault ? `${baseName} (mi versión)` : baseName;
    this.saving.set(true);
    this.settings.createTheme({ ...this.buildPayload(), name }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.toastr.success(`Tema "${created.name}" creado`);
        this.themeService.loadThemes().subscribe({
          next: (themes) => {
            const fresh = themes.find((t) => t.id === created.id);
            if (fresh) this.select(fresh);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected async deleteCurrent(): Promise<void> {
    const t = this.current();
    if (!t || t.isDefault) return;
    const ok = await this.dialogs.confirm({
      title: 'Eliminar tema',
      message: `¿Eliminar el tema "${t.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.settings.deleteTheme(t.id).subscribe({
      next: () => {
        this.toastr.success('Tema eliminado');
        this.themeService.loadThemes().subscribe({
          next: (themes) => {
            const fallback = themes.find((x) => x.isDefault) ?? themes[0];
            if (fallback) this.select(fallback);
            else this.current.set(null);
          },
        });
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  private buildPayload(): Record<string, unknown> {
    const v = this.editValues();
    return {
      isDark: v['isDark'],
      colorPrimary: v['colorPrimary'],
      colorSecondary: v['colorSecondary'],
      colorBackground: v['colorBackground'],
      colorSurface: v['colorSurface'],
      colorSurfaceHover: v['colorSurfaceHover'],
      colorBorder: v['colorBorder'],
      colorText: v['colorText'],
      colorTextMuted: v['colorTextMuted'],
      colorAccent: v['colorAccent'],
      colorDanger: v['colorDanger'],
      colorSuccess: v['colorSuccess'],
      fontFamily: v['fontFamily'],
      borderRadius: v['borderRadius'],
    };
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Error inesperado';
  }
}
