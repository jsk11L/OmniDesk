import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CreateListDto,
  CreateListFieldDto,
  CreateListItemDto,
  CreateListTagDto,
  List,
  ListField,
  ListItem,
  ListTag,
  UpdateListDto,
  UpdateListFieldDto,
  UpdateListItemDto,
} from '../lists.types';

@Injectable({ providedIn: 'root' })
export class ListsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/lists`;

  list(): Observable<List[]> {
    return this.http.get<ApiResponse<List[]>>(this.base).pipe(map((r) => r.data));
  }

  findById(id: string): Observable<List> {
    return this.http.get<ApiResponse<List>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(dto: CreateListDto): Observable<List> {
    return this.http.post<ApiResponse<List>>(this.base, dto).pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateListDto): Observable<List> {
    return this.http.patch<ApiResponse<List>>(`${this.base}/${id}`, dto).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  // Items
  listItems(
    listId: string,
    opts: { q?: string; tag?: string; sort?: string; dir?: string } = {},
  ): Observable<ListItem[]> {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.tag) params = params.set('tag', opts.tag);
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.dir) params = params.set('dir', opts.dir);
    return this.http
      .get<ApiResponse<ListItem[]>>(`${this.base}/${listId}/items`, { params })
      .pipe(map((r) => r.data));
  }

  createItem(listId: string, dto: CreateListItemDto): Observable<ListItem> {
    return this.http
      .post<ApiResponse<ListItem>>(`${this.base}/${listId}/items`, dto)
      .pipe(map((r) => r.data));
  }

  updateItem(listId: string, itemId: string, dto: UpdateListItemDto): Observable<ListItem> {
    return this.http
      .patch<ApiResponse<ListItem>>(`${this.base}/${listId}/items/${itemId}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteItem(listId: string, itemId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${listId}/items/${itemId}`)
      .pipe(map((r) => r.data));
  }

  // Fields
  createField(listId: string, dto: CreateListFieldDto): Observable<ListField> {
    return this.http
      .post<ApiResponse<ListField>>(`${this.base}/${listId}/fields`, dto)
      .pipe(map((r) => r.data));
  }

  updateField(listId: string, fieldId: string, dto: UpdateListFieldDto): Observable<ListField> {
    return this.http
      .patch<ApiResponse<ListField>>(`${this.base}/${listId}/fields/${fieldId}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteField(listId: string, fieldId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${listId}/fields/${fieldId}`)
      .pipe(map((r) => r.data));
  }

  // Tags
  createTag(listId: string, dto: CreateListTagDto): Observable<ListTag> {
    return this.http
      .post<ApiResponse<ListTag>>(`${this.base}/${listId}/tags`, dto)
      .pipe(map((r) => r.data));
  }

  deleteTag(listId: string, tagId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${listId}/tags/${tagId}`)
      .pipe(map((r) => r.data));
  }
}
