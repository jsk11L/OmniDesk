import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CreateBoardDto,
  CreateColumnDto,
  CreateItemDto,
  ReorderItemEntry,
  TodoBoard,
  TodoColumn,
  TodoItem,
  UpdateColumnDto,
  UpdateItemDto,
} from '../todos.types';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/todos`;

  listBoards(): Observable<TodoBoard[]> {
    return this.http.get<ApiResponse<TodoBoard[]>>(`${this.base}/boards`).pipe(map((r) => r.data));
  }

  findBoard(id: string): Observable<TodoBoard> {
    return this.http
      .get<ApiResponse<TodoBoard>>(`${this.base}/boards/${id}`)
      .pipe(map((r) => r.data));
  }

  createBoard(dto: CreateBoardDto): Observable<TodoBoard> {
    return this.http
      .post<ApiResponse<TodoBoard>>(`${this.base}/boards`, dto)
      .pipe(map((r) => r.data));
  }

  updateBoard(id: string, dto: Partial<CreateBoardDto>): Observable<TodoBoard> {
    return this.http
      .patch<ApiResponse<TodoBoard>>(`${this.base}/boards/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteBoard(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/boards/${id}`)
      .pipe(map((r) => r.data));
  }

  createColumn(boardId: string, dto: CreateColumnDto): Observable<TodoColumn> {
    return this.http
      .post<ApiResponse<TodoColumn>>(`${this.base}/boards/${boardId}/columns`, dto)
      .pipe(map((r) => r.data));
  }

  updateColumn(boardId: string, colId: string, dto: UpdateColumnDto): Observable<TodoColumn> {
    return this.http
      .patch<ApiResponse<TodoColumn>>(`${this.base}/boards/${boardId}/columns/${colId}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteColumn(boardId: string, colId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/boards/${boardId}/columns/${colId}`)
      .pipe(map((r) => r.data));
  }

  createItem(boardId: string, colId: string, dto: CreateItemDto): Observable<TodoItem> {
    return this.http
      .post<ApiResponse<TodoItem>>(
        `${this.base}/boards/${boardId}/columns/${colId}/items`,
        dto,
      )
      .pipe(map((r) => r.data));
  }

  updateItem(itemId: string, dto: UpdateItemDto): Observable<TodoItem> {
    return this.http
      .patch<ApiResponse<TodoItem>>(`${this.base}/items/${itemId}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteItem(itemId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/items/${itemId}`)
      .pipe(map((r) => r.data));
  }

  reorder(items: ReorderItemEntry[]): Observable<{ updated: number }> {
    return this.http
      .post<ApiResponse<{ updated: number }>>(`${this.base}/items/reorder`, { items })
      .pipe(map((r) => r.data));
  }
}
