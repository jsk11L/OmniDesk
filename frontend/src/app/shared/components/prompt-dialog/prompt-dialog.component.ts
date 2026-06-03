import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface PromptDialogData {
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** HTML input type, e.g. 'text' (default), 'number', 'url'. */
  inputType?: string;
  required?: boolean;
}

/**
 * Single-input modal that replaces native `prompt()`. Closes with the trimmed
 * string value on confirm, or `null` on cancel.
 */
@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule],
  template: `
    <form class="bg-surface text-text p-6 min-w-[320px] max-w-md" (ngSubmit)="submit()">
      <h2 class="text-lg font-semibold mb-2">{{ data.title }}</h2>
      @if (data.message) {
        <p class="text-sm text-text-muted mb-4 whitespace-pre-line">{{ data.message }}</p>
      }
      @if (data.label) {
        <label class="block text-sm mb-1">{{ data.label }}</label>
      }
      <input
        [type]="data.inputType ?? 'text'"
        [(ngModel)]="value"
        name="promptValue"
        [placeholder]="data.placeholder ?? ''"
        autocomplete="off"
        cdkFocusInitial
        class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary mb-6"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="ref.close(null)"
          class="px-4 py-2 rounded text-sm hover:bg-surface-hover transition-colors"
        >
          {{ data.cancelLabel ?? 'Cancelar' }}
        </button>
        <button
          type="submit"
          [disabled]="isInvalid()"
          class="px-4 py-2 rounded text-sm bg-primary text-white hover:opacity-90 disabled:opacity-50"
        >
          {{ data.confirmLabel ?? 'Aceptar' }}
        </button>
      </div>
    </form>
  `,
})
export class PromptDialogComponent {
  protected value: string;

  constructor(
    public ref: MatDialogRef<PromptDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData,
  ) {
    this.value = data.initialValue ?? '';
  }

  protected isInvalid(): boolean {
    return (this.data.required ?? true) && this.value.trim().length === 0;
  }

  protected submit(): void {
    if (this.isInvalid()) return;
    this.ref.close(this.value.trim());
  }
}
