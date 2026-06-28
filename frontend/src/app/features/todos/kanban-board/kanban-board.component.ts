import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { TodosService } from '../services/todos.service';
import { DialogService } from '../../../shared/services/dialog.service';
import {
  TodoItemDialogComponent,
  type TodoItemDialogData,
  type TodoItemDialogResult,
} from '../item-dialog/item-dialog.component';
import type {
  ReorderItemEntry,
  TodoBoard,
  TodoColumn,
  TodoItem,
  TodoPriority,
} from '../todos.types';

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  LOW: '#22c55e',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle, CdkDropListGroup, MatDialogModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-4 sm:px-6 py-4 border-b border-border">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold">TO-DO</h1>
            @if (boards().length > 0) {
              <select
                [(ngModel)]="selectedBoardId"
                (ngModelChange)="onBoardChange($event)"
                class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
              >
                @for (b of boards(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="createBoard()"
              class="px-3 py-2 rounded text-sm hover:bg-surface-hover"
            >
              + Board
            </button>
            <button
              type="button"
              (click)="addColumn()"
              [disabled]="!board()"
              class="px-3 py-2 rounded text-sm hover:bg-surface-hover disabled:opacity-50"
            >
              + Column
            </button>
            <button
              type="button"
              (click)="addItem(null)"
              [disabled]="!board()?.columns?.length"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              + Task
            </button>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-4">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (!board()) {
          <p class="text-text-muted text-center py-16">
            Create a board to get started.
          </p>
        } @else if (!board()!.columns?.length) {
          <p class="text-text-muted text-center py-16">
            This board has no columns yet.
          </p>
        } @else {
          <div
            cdkDropList
            cdkDropListOrientation="horizontal"
            [cdkDropListData]="board()!.columns!"
            (cdkDropListDropped)="onColumnDrop($event)"
            class="flex gap-4 h-full"
          >
            <ng-container cdkDropListGroup>
            @for (col of board()!.columns!; track col.id) {
              <div
                cdkDrag
                [cdkDragData]="col"
                class="flex-1 min-w-[280px] bg-surface border border-border-soft rounded-xl overflow-hidden flex flex-col max-h-full"
              >
                <div
                  class="px-3 py-2 border-b border-border-soft flex items-center justify-between gap-1"
                >
                  <span
                    cdkDragHandle
                    class="cursor-grab text-text-muted hover:text-text text-xs select-none"
                    title="Drag to reorder column"
                  >⠿</span>
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    [style.background-color]="col.color || 'var(--color-text-muted)'"
                  ></span>
                  <input
                    type="text"
                    [value]="col.name"
                    (blur)="renameColumn(col, $event)"
                    class="bg-transparent font-medium text-sm outline-none flex-1 mr-2"
                  />
                  <div class="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      (click)="toggleCompletionColumn(col)"
                      [class]="
                        'w-7 h-7 grid place-items-center rounded text-sm transition-colors ' +
                        (col.isCompletionColumn
                          ? 'text-success hover:bg-surface-hover'
                          : 'text-text-muted hover:bg-surface-hover hover:text-text opacity-60')
                      "
                      [title]="
                        col.isCompletionColumn
                          ? 'Completion column (click to unset)'
                          : 'Mark as completion column'
                      "
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      (click)="addItem(col.id)"
                      class="w-7 h-7 grid place-items-center rounded text-base text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
                      title="Add task"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      (click)="deleteColumn(col)"
                      class="w-7 h-7 grid place-items-center rounded text-base text-text-muted hover:bg-surface-hover hover:text-danger transition-colors"
                      title="Delete column"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  cdkDropList
                  [cdkDropListData]="col.items"
                  [id]="col.id"
                  (cdkDropListDropped)="onDrop($event)"
                  class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]"
                >
                  @for (item of col.items; track item.id) {
                    <div
                      cdkDrag
                      (click)="editItem(col.id, item)"
                      class="bg-background border border-border-soft rounded-lg p-3 cursor-grab hover:border-primary transition-colors shadow-sm"
                    >
                      <div class="flex items-start justify-between gap-2 mb-1">
                        <h3 class="text-sm font-medium leading-tight">{{ item.title }}</h3>
                        <span
                          class="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                          [style.background-color]="priorityColor(item.priority) + '33'"
                          [style.color]="priorityColor(item.priority)"
                        >
                          {{ priorityLabel(item.priority) }}
                        </span>
                      </div>
                      @if (item.description) {
                        <p class="text-xs text-text-muted line-clamp-2">{{ item.description }}</p>
                      }
                      <div class="flex items-center justify-between mt-2 text-xs text-text-muted">
                        @if (item.dueDate) {
                          <span>{{ formatDueDate(item.dueDate) }}</span>
                        } @else {
                          <span></span>
                        }
                        @if (item.tags.length) {
                          <div class="flex gap-1 flex-wrap justify-end">
                            @for (t of item.tags.slice(0, 3); track t) {
                              <span class="px-1.5 py-0.5 bg-surface-hover rounded">{{ t }}</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            </ng-container>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .cdk-drag-preview {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        background: var(--color-surface);
      }
      :host ::ng-deep .cdk-drag-placeholder {
        opacity: 0.3;
      }
      :host ::ng-deep .cdk-drop-list-dragging .cdk-drag {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class KanbanBoardComponent implements OnInit {
  private readonly service = inject(TodosService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly boards = signal<TodoBoard[]>([]);
  protected readonly board = signal<TodoBoard | null>(null);
  protected selectedBoardId = '';

  ngOnInit(): void {
    this.service.listBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        const first = boards.find((b) => b.isDefault) ?? boards[0];
        if (first) {
          this.selectedBoardId = first.id;
          this.loadBoard(first.id);
        } else {
          this.loading.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected priorityColor(p: TodoPriority): string {
    return PRIORITY_COLORS[p];
  }

  protected priorityLabel(p: TodoPriority): string {
    return PRIORITY_LABEL[p];
  }

  protected formatDueDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });
  }

  protected onBoardChange(id: string): void {
    this.loadBoard(id);
  }

  private loadBoard(id: string): void {
    this.loading.set(true);
    this.service.findBoard(id).subscribe({
      next: (board) => {
        // Sort columns and items by position
        if (board.columns) {
          board.columns.sort((a, b) => a.position - b.position);
          for (const col of board.columns) {
            col.items.sort((a, b) => a.position - b.position);
          }
        }
        this.board.set(board);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  protected async createBoard(): Promise<void> {
    const name = await this.dialogs.prompt({
      title: 'New board',
      label: 'Board name',
      confirmLabel: 'Create',
    });
    if (!name?.trim()) return;
    this.service.createBoard({ name: name.trim() }).subscribe({
      next: (board) => {
        this.boards.update((arr) => [...arr, board]);
        this.selectedBoardId = board.id;
        this.loadBoard(board.id);
        this.toastr.success('Board created');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected async addColumn(): Promise<void> {
    const board = this.board();
    if (!board) return;
    const name = await this.dialogs.prompt({
      title: 'New column',
      label: 'Column name',
      confirmLabel: 'Create',
    });
    if (!name?.trim()) return;
    this.service.createColumn(board.id, { name: name.trim() }).subscribe({
      next: (column) => {
        const next = { ...board, columns: [...(board.columns ?? []), { ...column, items: [] }] };
        this.board.set(next);
        this.toastr.success('Column created');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected renameColumn(col: TodoColumn, event: Event): void {
    const board = this.board();
    if (!board) return;
    const newName = (event.target as HTMLInputElement).value.trim();
    if (!newName || newName === col.name) return;
    this.service.updateColumn(board.id, col.id, { name: newName }).subscribe({
      next: () => this.toastr.success('Column renamed'),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected async deleteColumn(col: TodoColumn): Promise<void> {
    const board = this.board();
    if (!board) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete column',
      message: `Delete the column "${col.name}" with its tasks?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.deleteColumn(board.id, col.id).subscribe({
      next: () => {
        const next = {
          ...board,
          columns: (board.columns ?? []).filter((c) => c.id !== col.id),
        };
        this.board.set(next);
        this.toastr.success('Column deleted');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected toggleCompletionColumn(col: TodoColumn): void {
    const board = this.board();
    if (!board) return;
    const next = !col.isCompletionColumn;
    this.service.updateColumn(board.id, col.id, { isCompletionColumn: next }).subscribe({
      next: () => {
        col.isCompletionColumn = next;
        this.board.set({ ...board });
        this.toastr.success(
          next ? 'Column marked as completion' : 'Completion mark removed',
        );
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected addItem(columnId: string | null): void {
    const board = this.board();
    if (!board || !board.columns?.length) return;
    const targetCol = columnId ?? board.columns[0].id;
    this.openItemDialog(targetCol);
  }

  protected editItem(columnId: string, item: TodoItem): void {
    this.openItemDialog(columnId, item);
  }

  private openItemDialog(columnId: string, item?: TodoItem): void {
    const board = this.board();
    if (!board) return;
    const ref = this.dialog.open<TodoItemDialogComponent, TodoItemDialogData, TodoItemDialogResult>(
      TodoItemDialogComponent,
      { data: { board, columnId, item } },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadBoard(board.id);
    });
  }

  protected onColumnDrop(event: CdkDragDrop<TodoColumn[]>): void {
    const board = this.board();
    if (!board?.columns) return;
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(board.columns, event.previousIndex, event.currentIndex);

    // Persist only the columns whose position actually changed.
    const changed: { id: string; position: number }[] = [];
    board.columns.forEach((c, idx) => {
      if (c.position !== idx) {
        changed.push({ id: c.id, position: idx });
        c.position = idx;
      }
    });
    this.board.set({ ...board });
    if (!changed.length) return;

    forkJoin(
      changed.map((u) => this.service.updateColumn(board.id, u.id, { position: u.position })),
    ).subscribe({
      error: (err: HttpErrorResponse) => {
        this.toastr.error('Could not save the column order: ' + this.errMsg(err));
        this.loadBoard(board.id);
      },
    });
  }

  protected onDrop(event: CdkDragDrop<TodoItem[]>): void {
    const board = this.board();
    if (!board) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    // Rebuild reorder payload for all affected columns
    const payload: ReorderItemEntry[] = [];
    for (const col of board.columns ?? []) {
      col.items.forEach((item, idx) => {
        payload.push({ id: item.id, columnId: col.id, position: idx });
        item.position = idx;
        item.columnId = col.id;
      });
    }

    this.service.reorder(payload).subscribe({
      error: (err: HttpErrorResponse) => {
        this.toastr.error('Could not save the order: ' + this.errMsg(err));
        this.loadBoard(board.id);
      },
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
