import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';

export interface UploadedImage {
  url: string;
  thumbUrl: string;
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/uploads`;

  upload(file: File): Observable<UploadedImage> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<UploadedImage>>(this.endpoint, formData)
      .pipe(map((res) => res.data));
  }

  resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/uploads')) {
      return `${environment.apiUrl}${url}`;
    }
    return url;
  }
}
