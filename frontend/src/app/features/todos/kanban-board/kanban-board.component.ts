import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

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
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDropListGroup, MatDialogModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <div class="flex items-center justify-between gap-4 mb-3">
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
              + Tablero
            </button>
            <button
              type="button"
              (click)="addColumn()"
              [disabled]="!board()"
              class="px-3 py-2 rounded text-sm hover:bg-surface-hover disabled:opacity-50"
            >
              + Columna
            </button>
            <button
              type="button"
              (click)="addItem(null)"
              [disabled]="!board()?.columns?.length"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              + Tarea
            </button>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-4">
        @if (loading()) {
          <p class="text-text-muted">Cargando…</p>
        } @else if (!board()) {
          <p class="text-text-muted text-center py-16">
            Crea un tablero para empezar.
          </p>
        } @else if (!board()!.columns?.length) {
          <p class="text-text-muted text-center py-16">
            Este tablero no tiene columnas todavía.
          </p>
        } @else {
          <div
            class="flex gap-4 h-full"
            cdkDropListGroup
          >
            @for (col of board()!.columns!; track col.id) {
              <div
                class="w-72 shrink-0 bg-surface border border-border rounded flex flex-col max-h-full"
              >
                <div
                  class="px-3 py-2 border-b border-border flex items-center justify-between"
                  [style.border-top]="'3px solid ' + col.color"
                >
                  <input
                    type="text"
                    [value]="col.name"
                    (blur)="renameColumn(col, $event)"
                    class="bg-transparent font-medium text-sm outline-none flex-1 mr-2"
                  />
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="toggleCompletionColumn(col)"
                      [class]="
                        col.isCompletionColumn
                          ? 'text-success text-xs'
                          : 'text-text-muted hover:text-text text-xs opacity-50'
                      "
                      [title]="
                        col.isCompletionColumn
                          ? 'Columna de finalización (clic para quitar)'
                          : 'Marcar como columna de finalización'
                      "
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      (click)="addItem(col.id)"
                      class="text-text-muted hover:text-text text-xs"
                      title="Añadir tarea"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      (click)="deleteColumn(col)"
                      class="text-text-muted hover:text-danger text-xs"
                      title="Eliminar columna"
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
                      class="bg-background border border-border rounded p-3 cursor-grab hover:border-primary transition-colors"
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
    return new Date(iso).toLocaleDateString('es-CL', {
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
      title: 'Nuevo tablero',
      label: 'Nombre del tablero',
      confirmLabel: 'Crear',
    });
    if (!name?.trim()) return;
    this.service.createBoard({ name: name.trim() }).subscribe({
      next: (board) => {
        this.boards.update((arr) => [...arr, board]);
        this.selectedBoardId = board.id;
        this.loadBoard(board.id);
        this.toastr.success('Tablero creado');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected async addColumn(): Promise<void> {
    const board = this.board();
    if (!board) return;
    const name = await this.dialogs.prompt({
      title: 'Nueva columna',
      label: 'Nombre de la columna',
      confirmLabel: 'Crear',
    });
    if (!name?.trim()) return;
    this.service.createColumn(board.id, { name: name.trim() }).subscribe({
      next: (column) => {
        const next = { ...board, columns: [...(board.columns ?? []), { ...column, items: [] }] };
        this.board.set(next);
        this.toastr.success('Columna creada');
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
      next: () => this.toastr.success('Columna renombrada'),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected async deleteColumn(col: TodoColumn): Promise<void> {
    const board = this.board();
    if (!board) return;
    const ok = await this.dialogs.confirm({
      title: 'Eliminar columna',
      message: `¿Eliminar la columna "${col.name}" con sus tareas?`,
      confirmLabel: 'Eliminar',
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
        this.toastr.success('Columna eliminada');
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
          next ? 'Columna marcada como de finalización' : 'Marca de finalización quitada',
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
        this.toastr.error('No se pudo guardar el orden: ' + this.errMsg(err));
        this.loadBoard(board.id);
      },
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Error inesperado';
  }
}
