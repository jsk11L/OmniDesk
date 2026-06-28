import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';

export interface ImportOwnReport {
  mode: 'replace' | 'merge';
  counts: Record<string, number>;
}

/** Authenticated file downloads (the JWT interceptor adds the token). */
@Injectable({ providedIn: 'root' })
export class DataExportService {
  private readonly http = inject(HttpClient);

  importOmnidesk(file: File, mode: 'replace' | 'merge'): Observable<ImportOwnReport> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http
      .post<ApiResponse<ImportOwnReport>>(`${environment.apiUrl}/import/omnidesk?mode=${mode}`, fd)
      .pipe(map((r) => r.data));
  }

  exportAll(): Observable<HttpResponse<Blob>> {
    return this.http.post(`${environment.apiUrl}/export/all`, {}, { observe: 'response', responseType: 'blob' });
  }

  noteMarkdown(noteId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/export/notes/${noteId}/markdown`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  /** Save a downloaded blob, honouring the Content-Disposition filename. */
  save(res: HttpResponse<Blob>, fallback: string): void {
    const body = res.body;
    if (!body) return;
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? fallback;
    const url = URL.createObjectURL(body);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
