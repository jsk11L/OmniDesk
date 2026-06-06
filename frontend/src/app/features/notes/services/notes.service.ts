import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { CreateNoteDto, Note, UpdateNoteDto } from '../notes.types';

export interface ImportReport {
  notesCreated: number;
  assetsUploaded: number;
  wikilinksResolved: number;
  wikilinksUnresolved: number;
  duplicateTitlesRenamed: number;
  skipped: string[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notes`;

  importObsidian(file: File): Observable<ImportReport> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http
      .post<ApiResponse<ImportReport>>(`${environment.apiUrl}/import/obsidian`, fd)
      .pipe(map((r) => r.data));
  }

  list(opts: { q?: string; tag?: string; pinned?: boolean } = {}): Observable<Note[]> {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.tag) params = params.set('tag', opts.tag);
    if (opts.pinned !== undefined) params = params.set('pinned', String(opts.pinned));
    return this.http.get<ApiResponse<Note[]>>(this.base, { params }).pipe(map((r) => r.data));
  }

  findById(id: string): Observable<Note> {
    return this.http.get<ApiResponse<Note>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(dto: CreateNoteDto): Observable<Note> {
    return this.http.post<ApiResponse<Note>>(this.base, dto).pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateNoteDto): Observable<Note> {
    return this.http.patch<ApiResponse<Note>>(`${this.base}/${id}`, dto).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }
}
