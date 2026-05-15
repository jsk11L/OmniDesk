import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ListViewType = 'GRID' | 'TABLE' | 'GALLERY' | 'LIST';

interface ViewOption {
  value: ListViewType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-view-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex gap-0.5 p-0.5 bg-surface-hover rounded">
      @for (opt of options; track opt.value) {
        <button
          type="button"
          (click)="viewChange.emit(opt.value)"
          [class]="
            'px-2.5 py-1 text-xs rounded transition-colors ' +
            (value() === opt.value
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-muted hover:text-text')
          "
          [attr.aria-pressed]="value() === opt.value"
          [title]="opt.label"
        >
          <span class="mr-1">{{ opt.icon }}</span>{{ opt.label }}
        </button>
      }
    </div>
  `,
})
export class ViewSwitcherComponent {
  readonly value = input.required<ListViewType>();
  readonly viewChange = output<ListViewType>();

  protected readonly options: ViewOption[] = [
    { value: 'GRID', label: 'Grid', icon: '▦' },
    { value: 'TABLE', label: 'Tabla', icon: '☰' },
    { value: 'GALLERY', label: 'Galería', icon: '◫' },
    { value: 'LIST', label: 'Lista', icon: '≡' },
  ];
}
