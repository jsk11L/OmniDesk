import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import {
  CARD_FONTS,
  DEFAULT_CARD_STYLE,
  levelToCss,
  type CardStyle,
  type LevelStyle,
  type StyleLevel,
} from '../lists.types';

export interface CardStyleDialogData {
  cardStyle: CardStyle;
}

@Component({
  selector: 'app-card-style-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text w-[min(720px,96vw)] max-h-[90vh] flex flex-col">
      <div class="p-5 border-b border-border-soft flex items-center justify-between">
        <h2 class="text-lg font-semibold">Card style</h2>
        <button type="button" (click)="reset()" class="text-xs text-text-muted hover:text-text">Reset to defaults</button>
      </div>

      <div class="p-5 overflow-y-auto grid md:grid-cols-[1fr_240px] gap-5">
        <!-- Levels -->
        <div class="space-y-4">
          @for (lvl of levels; track lvl.key) {
            <div class="border border-border-soft rounded-lg p-3">
              <div class="text-sm font-medium mb-2">{{ lvl.label }}</div>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="block text-xs text-text-muted mb-1">Font</span>
                  <select [(ngModel)]="style.levels[lvl.key].font"
                    class="w-full px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                    @for (f of fonts; track f.value) {
                      <option [value]="f.value">{{ f.label }}</option>
                    }
                  </select>
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="block">
                    <span class="block text-xs text-text-muted mb-1">Size</span>
                    <input type="number" min="8" max="80" [(ngModel)]="style.levels[lvl.key].size"
                      class="w-full px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
                  </label>
                  <label class="block">
                    <span class="block text-xs text-text-muted mb-1">Weight</span>
                    <select [(ngModel)]="style.levels[lvl.key].weight"
                      class="w-full px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary">
                      <option [ngValue]="400">Regular</option>
                      <option [ngValue]="500">Medium</option>
                      <option [ngValue]="600">Semibold</option>
                      <option [ngValue]="700">Bold</option>
                    </select>
                  </label>
                </div>
              </div>
              <div class="flex items-center gap-4 mt-2 text-xs text-text-muted flex-wrap">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [checked]="style.levels[lvl.key].transform === 'uppercase'"
                    (change)="toggleUpper(lvl.key)" class="accent-primary" /> UPPERCASE
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="style.levels[lvl.key].shadow" class="accent-primary" /> Text shadow
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [checked]="!!style.levels[lvl.key].color"
                    (change)="toggleColor(lvl.key, $event)" class="accent-primary" /> Custom color
                </label>
                @if (style.levels[lvl.key].color) {
                  <input type="color" [(ngModel)]="style.levels[lvl.key].color"
                    class="w-7 h-7 bg-background border border-border rounded cursor-pointer p-0" />
                }
              </div>
            </div>
          }

          <!-- Card chrome -->
          <div class="border border-border-soft rounded-lg p-3 space-y-2">
            <div class="text-sm font-medium">Card</div>
            <div class="flex items-center gap-4 text-xs text-text-muted flex-wrap">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [checked]="!!style.background" (change)="toggleCard('background', $event)" class="accent-primary" /> Background
              </label>
              @if (style.background) {
                <input type="color" [(ngModel)]="style.background" class="w-7 h-7 bg-background border border-border rounded cursor-pointer p-0" />
              }
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [checked]="!!style.border" (change)="toggleCard('border', $event)" class="accent-primary" /> Border
              </label>
              @if (style.border) {
                <input type="color" [(ngModel)]="style.border" class="w-7 h-7 bg-background border border-border rounded cursor-pointer p-0" />
              }
            </div>
            <label class="block">
              <span class="block text-xs text-text-muted mb-1">Image overlay (legibility over light images) — {{ style.imageScrim }}%</span>
              <input type="range" min="0" max="90" [(ngModel)]="style.imageScrim" class="w-full accent-primary" />
            </label>
          </div>
        </div>

        <!-- Live preview -->
        <div>
          <div class="text-xs uppercase-tag mb-2">Preview</div>
          <div class="rounded-lg border p-4 space-y-1.5 overflow-hidden"
            [style.background]="style.background || 'var(--color-surface)'"
            [style.border-color]="style.border || 'var(--color-border)'">
            <div [style]="css('caption')">CAPTION · 2026</div>
            <div [style]="css('subtitle')">Subtitle line</div>
            <div [style]="css('title')">Card Title</div>
            <div [style]="css('body')">Body text shows how a longer description reads on the card.</div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-border-soft flex justify-end gap-2">
        <button type="button" (click)="ref.close()" class="px-4 py-2 rounded text-sm hover:bg-surface-hover">Cancel</button>
        <button type="button" (click)="ref.close(style)" class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">Apply</button>
      </div>
    </div>
  `,
})
export class CardStyleDialogComponent {
  protected readonly fonts = CARD_FONTS;
  protected readonly levels: { key: StyleLevel; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'body', label: 'Body' },
    { key: 'caption', label: 'Caption' },
  ];
  protected style: CardStyle;

  constructor(
    public ref: MatDialogRef<CardStyleDialogComponent, CardStyle | undefined>,
    @Inject(MAT_DIALOG_DATA) data: CardStyleDialogData,
  ) {
    this.style = structuredClone(data.cardStyle);
  }

  protected css(level: StyleLevel): { [k: string]: string } {
    return levelToCss(this.style.levels[level]);
  }

  protected toggleUpper(level: StyleLevel): void {
    const l = this.style.levels[level];
    l.transform = l.transform === 'uppercase' ? 'none' : 'uppercase';
  }

  protected toggleColor(level: StyleLevel, event: Event): void {
    this.style.levels[level].color = (event.target as HTMLInputElement).checked ? '#ffffff' : '';
  }

  protected toggleCard(key: 'background' | 'border', event: Event): void {
    this.style[key] = (event.target as HTMLInputElement).checked
      ? key === 'background'
        ? '#1a1a1a'
        : '#3a3a3a'
      : '';
  }

  protected reset(): void {
    this.style = structuredClone(DEFAULT_CARD_STYLE);
  }
}
