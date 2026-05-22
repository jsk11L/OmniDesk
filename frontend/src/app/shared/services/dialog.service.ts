import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

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
}
