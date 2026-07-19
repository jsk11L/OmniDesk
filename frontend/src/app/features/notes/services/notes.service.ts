import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  AnchoredNote,
  CreateNoteDto,
  Note,
  NoteAnchorType,
  NoteSummary,
  UpdateNoteDto,
} from '../notes.types';

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

  /** Sidebar metadata only — note bodies come from findById when opened. */
  list(opts: { q?: string; tag?: string; pinned?: boolean } = {}): Observable<NoteSummary[]> {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.tag) params = params.set('tag', opts.tag);
    if (opts.pinned !== undefined) params = params.set('pinned', String(opts.pinned));
    return this.http.get<ApiResponse<NoteSummary[]>>(this.base, { params }).pipe(map((r) => r.data));
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

  /** All anchored notes (hidden from the main list), with their element label. */
  listAnchored(): Observable<AnchoredNote[]> {
    return this.http
      .get<ApiResponse<AnchoredNote[]>>(`${this.base}/anchored`)
      .pipe(map((r) => r.data));
  }

  /** The note anchored to a given element, or null if none yet. */
  findByAnchor(type: NoteAnchorType, id: string): Observable<Note | null> {
    const params = new HttpParams().set('type', type).set('id', id);
    return this.http
      .get<ApiResponse<Note | null>>(`${this.base}/anchor`, { params })
      .pipe(map((r) => r.data));
  }
}
