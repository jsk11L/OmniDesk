import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-image-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()"
        [alt]="alt() ?? ''"
        loading="lazy"
        decoding="async"
        (error)="onError()"
        [class]="imgClass()"
      />
    } @else {
      <div
        [class]="
          'flex items-center justify-center bg-surface-hover text-text-muted text-xs ' +
          imgClass()
        "
      >
        {{ placeholder() }}
      </div>
    }
  `,
})
export class ImageCellComponent {
  readonly src = input<string | null>(null);
  readonly alt = input<string | null>(null);
  readonly placeholder = input<string>('—');
  readonly imgClass = input<string>('w-10 h-10 object-cover rounded');

  protected readonly failed = signal(false);

  onError(): void {
    this.failed.set(true);
  }
}
