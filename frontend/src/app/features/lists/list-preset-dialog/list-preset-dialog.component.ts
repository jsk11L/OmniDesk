import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { LIST_PRESETS, type ListPreset } from '../list-presets';

export type ListPresetDialogResult = { preset: ListPreset; name: string } | undefined;

@Component({
  selector: 'app-list-preset-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text w-[min(680px,96vw)] max-h-[90vh] flex flex-col">
      <div class="p-5 border-b border-border-soft">
        <h2 class="text-lg font-semibold">New list from a template</h2>
        <p class="text-sm text-text-muted mt-0.5">Pick a starting point — you can fully customize it afterwards.</p>
      </div>

      <div class="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
        @for (p of presets; track p.id) {
          <button type="button" (click)="choose(p)"
            [class]="'text-left p-3 rounded-lg border transition-colors ' +
              (selected().id === p.id ? 'border-primary bg-primary-ghost' : 'border-border-soft hover:bg-surface-hover')">
            <div class="text-2xl mb-1">{{ p.icon }}</div>
            <div class="font-medium text-sm">{{ p.name }}</div>
            <div class="text-xs text-text-muted mt-0.5 leading-snug">{{ p.description }}</div>
          </button>
        }
      </div>

      <div class="p-4 border-t border-border-soft flex items-center gap-2">
        <input type="text" [(ngModel)]="name" maxlength="100" placeholder="List name"
          class="flex-1 px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
        <button type="button" (click)="ref.close()" class="px-4 py-2 rounded text-sm hover:bg-surface-hover">Cancel</button>
        <button type="button" (click)="create()" [disabled]="!name.trim()"
          class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
          Create
        </button>
      </div>
    </div>
  `,
})
export class ListPresetDialogComponent {
  protected readonly presets = LIST_PRESETS;
  protected readonly selected = signal<ListPreset>(LIST_PRESETS[0]);
  protected name = '';

  constructor(public ref: MatDialogRef<ListPresetDialogComponent, ListPresetDialogResult>) {}

  protected choose(p: ListPreset): void {
    this.selected.set(p);
    if (!this.name.trim() && p.id !== 'blank') this.name = p.name;
  }

  protected create(): void {
    const name = this.name.trim();
    if (!name) return;
    this.ref.close({ preset: this.selected(), name });
  }
}
