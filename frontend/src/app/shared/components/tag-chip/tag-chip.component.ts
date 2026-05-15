import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      [style.background-color]="bgColor()"
      [style.color]="textColor()"
    >
      {{ label() }}
      @if (removable()) {
        <button
          type="button"
          (click)="remove.emit()"
          class="text-current opacity-60 hover:opacity-100 ml-1"
          aria-label="Eliminar tag"
        >
          ×
        </button>
      }
    </span>
  `,
})
export class TagChipComponent {
  readonly label = input.required<string>();
  readonly color = input<string>('#94a3b8');
  readonly removable = input<boolean>(false);

  readonly remove = output<void>();

  protected bgColor(): string {
    return `${this.color()}33`;
  }

  protected textColor(): string {
    return this.color();
  }
}
