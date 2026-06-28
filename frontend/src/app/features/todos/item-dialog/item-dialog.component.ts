import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { TodosService } from '../services/todos.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { NotificationAttachPanelComponent } from '../../../shared/components/notification-attach-panel/notification-attach-panel.component';
import type { TodoBoard, TodoItem, TodoPriority } from '../todos.types';

export interface TodoItemDialogData {
  board: TodoBoard;
  columnId: string;
  item?: TodoItem;
}

export type TodoItemDialogResult = TodoItem | { deleted: string } | undefined;

@Component({
  selector: 'app-todo-item-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, NotificationAttachPanelComponent],
  template: `
    <div class="bg-surface text-text p-6 w-[min(520px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">
        {{ data.item ? 'Edit task' : 'New task' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input
            type="text"
            formControlName="title"
            maxlength="200"
            autofocus
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Description</span>
          <textarea
            formControlName="description"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
          ></textarea>
        </label>

        <div class="space-y-3 border border-border rounded-lg p-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" formControlName="hasDueDate" class="accent-primary" />
            <span class="text-sm">Set due date</span>
          </label>
          @if (form.value.hasDueDate) {
            <input
              type="datetime-local"
              formControlName="dueDate"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          }

          <label class="flex items-center gap-2 cursor-pointer pt-1 border-t border-border">
            <input type="checkbox" formControlName="hasPriority" class="accent-primary" />
            <span class="text-sm">Set priority</span>
          </label>
          @if (form.value.hasPriority) {
            <select
              formControlName="priority"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          }
        </div>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Column</span>
          <select
            formControlName="columnId"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          >
            @for (col of data.board.columns ?? []; track col.id) {
              <option [value]="col.id">{{ col.name }}</option>
            }
          </select>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Tags (comma-separated)</span>
          <input
            type="text"
            formControlName="tags"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            placeholder="work, urgent"
          />
        </label>

        @if (data.item) {
          <div class="border-t border-border pt-3">
            <app-notification-attach-panel entityType="todo-item" [entityId]="data.item.id" />
          </div>
        }

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          @if (data.item) {
            <button
              type="button"
              (click)="remove()"
              [disabled]="loading()"
              class="text-sm text-danger hover:underline"
            >
              Delete
            </button>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button
              type="button"
              (click)="ref.close()"
              class="px-4 py-2 text-sm rounded hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ loading() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class TodoItemDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TodosService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form;

  constructor(
    public ref: MatDialogRef<TodoItemDialogComponent, TodoItemDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: TodoItemDialogData,
  ) {
    const item = data.item;
    const dueDateValue = item?.dueDate ? this.toLocalInput(new Date(item.dueDate)) : '';
    this.form = this.fb.nonNullable.group({
      title: [item?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      description: [item?.description ?? ''],
      hasPriority: [item?.hasPriority ?? false],
      priority: [(item?.priority ?? 'MEDIUM') as TodoPriority],
      hasDueDate: [item?.hasDueDate ?? Boolean(item?.dueDate)],
      dueDate: [dueDateValue],
      columnId: [item?.columnId ?? data.columnId],
      tags: [(item?.tags ?? []).join(', ')],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      priority: raw.hasPriority ? raw.priority : 'MEDIUM' as TodoPriority,
      hasPriority: raw.hasPriority,
      dueDate: raw.hasDueDate && raw.dueDate ? new Date(raw.dueDate).toISOString() : undefined,
      hasDueDate: raw.hasDueDate,
      tags,
    };

    const request$ = this.data.item
      ? this.service.updateItem(this.data.item.id, {
          ...payload,
          columnId: raw.columnId,
        })
      : this.service.createItem(this.data.board.id, raw.columnId, payload);

    request$.subscribe({
      next: (item) => {
        this.toastr.success(this.data.item ? 'Task updated' : 'Task created');
        this.ref.close(item);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.item || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete task',
      message: 'Delete this task?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.loading.set(true);
    this.service.deleteItem(this.data.item.id).subscribe({
      next: ({ id }) => {
        this.toastr.success('Task deleted');
        this.ref.close({ deleted: id });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  private toLocalInput(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
