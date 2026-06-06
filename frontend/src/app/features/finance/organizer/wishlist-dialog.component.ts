import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { OrganizerService } from '../services/organizer.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ImageInputComponent } from '../../../shared/components/image-input/image-input.component';
import { NotificationAttachPanelComponent } from '../../../shared/components/notification-attach-panel/notification-attach-panel.component';
import type { WishlistItem, WishlistPriority } from '../finance.types';

export interface WishlistDialogData {
  boardId: string;
  item?: WishlistItem;
}
export type WishlistDialogResult = 'changed' | undefined;

@Component({
  selector: 'app-wishlist-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, ImageInputComponent, NotificationAttachPanelComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(520px,95vw)] max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">{{ data.item ? 'Edit wish' : 'New wish' }}</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input type="text" formControlName="title" maxlength="200" autofocus class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Description</span>
          <textarea formControlName="description" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"></textarea>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Estimated price</span>
            <input type="number" formControlName="estimatedPrice" min="0" step="0.01" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Priority</span>
            <select formControlName="priority" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Link (optional)</span>
          <input type="url" formControlName="url" placeholder="https://…" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Category (optional)</span>
          <input type="text" formControlName="category" maxlength="100" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary" />
        </label>
        <div>
          <span class="block text-xs text-text-muted mb-1">Image (optional)</span>
          <app-image-input [initialValue]="imageUrl()" (valueChange)="imageUrl.set($event)" />
        </div>

        @if (data.item) {
          <div class="border-t border-border pt-3">
            <app-notification-attach-panel entityType="wishlist-item" [entityId]="data.item.id" />
          </div>
        }
        @if (error()) { <p class="text-sm text-danger">{{ error() }}</p> }

        <div class="flex justify-between items-center pt-2">
          @if (data.item) {
            <button type="button" (click)="remove()" class="text-sm text-danger hover:underline">Delete</button>
          } @else { <span></span> }
          <div class="flex gap-2">
            <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">Cancel</button>
            <button type="submit" [disabled]="form.invalid || loading()" class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">{{ loading() ? 'Saving…' : 'Save' }}</button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class WishlistDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrganizerService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly form;

  constructor(
    public ref: MatDialogRef<WishlistDialogComponent, WishlistDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: WishlistDialogData,
  ) {
    const i = data.item;
    this.imageUrl.set(i?.imageUrl ?? null);
    this.form = this.fb.nonNullable.group({
      title: [i?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      description: [i?.description ?? ''],
      estimatedPrice: [i?.estimatedPrice ?? (null as number | null)],
      priority: [(i?.priority ?? 'MEDIUM') as WishlistPriority],
      url: [i?.url ?? ''],
      category: [i?.category ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      estimatedPrice: raw.estimatedPrice != null ? Number(raw.estimatedPrice) : undefined,
      priority: raw.priority,
      url: raw.url.trim() || undefined,
      category: raw.category.trim() || undefined,
      imageUrl: this.imageUrl() ?? undefined,
    };
    const req$ = this.data.item
      ? this.service.updateWishlist(this.data.item.id, dto)
      : this.service.createWishlist(this.data.boardId, dto);
    req$.subscribe({
      next: () => {
        this.toastr.success(this.data.item ? 'Wish updated' : 'Wish added');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.msg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.item) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete wish',
      message: `Delete "${this.data.item.title}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteWishlist(this.data.item.id).subscribe({
      next: () => {
        this.toastr.success('Wish deleted');
        this.ref.close('changed');
      },
      error: (err: HttpErrorResponse) => this.error.set(this.msg(err)),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const m = body?.error?.message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
    return 'Something went wrong';
  }
}
