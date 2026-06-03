import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';
import {
  PromptDialogComponent,
  type PromptDialogData,
} from '../components/prompt-dialog/prompt-dialog.component';

const DEFAULT_CONFIG: MatDialogConfig = {
  width: 'min(560px, 92vw)',
  maxWidth: '92vw',
  maxHeight: '90vh',
  panelClass: 'omni-dialog',
  backdropClass: 'omni-backdrop',
  autoFocus: 'first-tabbable',
  restoreFocus: true,
  hasBackdrop: true,
  disableClose: false,
};

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  open<TComponent, TData = unknown, TResult = unknown>(
    component: ComponentType<TComponent>,
    data?: TData,
    overrides?: MatDialogConfig<TData>,
  ): MatDialogRef<TComponent, TResult> {
    return this.dialog.open<TComponent, TData, TResult>(component, {
      ...DEFAULT_CONFIG,
      ...overrides,
      data,
    });
  }

  /**
   * Themed replacement for native `confirm()`. Resolves `true` only when the
   * user confirms.
   */
  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      data,
      { width: 'min(420px, 92vw)' },
    );
    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  /**
   * Themed replacement for native `prompt()`. Resolves the trimmed input value,
   * or `null` if cancelled.
   */
  async prompt(data: PromptDialogData): Promise<string | null> {
    const ref = this.open<PromptDialogComponent, PromptDialogData, string | null>(
      PromptDialogComponent,
      data,
      { width: 'min(420px, 92vw)' },
    );
    return (await firstValueFrom(ref.afterClosed())) ?? null;
  }
}
