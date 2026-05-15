import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 min-w-[320px] max-w-md">
      <h2 class="text-lg font-semibold mb-2">{{ data.title }}</h2>
      <p class="text-sm text-text-muted mb-6 whitespace-pre-line">{{ data.message }}</p>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="ref.close(false)"
          class="px-4 py-2 rounded text-sm hover:bg-surface-hover transition-colors"
        >
          {{ data.cancelLabel ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          (click)="ref.close(true)"
          [class]="
            data.destructive
              ? 'px-4 py-2 rounded text-sm bg-danger text-white hover:opacity-90'
              : 'px-4 py-2 rounded text-sm bg-primary text-white hover:opacity-90'
          "
        >
          {{ data.confirmLabel ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public ref: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}
}
