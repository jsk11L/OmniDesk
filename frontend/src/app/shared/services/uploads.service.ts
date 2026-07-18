import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';

export interface UploadedImage {
  url: string;
  thumbUrl: string;
}

export interface UploadUsage {
  used: number;
  quota: number;
  percent: number;
}

export interface StorageInfo {
  uploads: UploadUsage;
  data: { total: number; breakdown: { module: string; count: number; bytes: number }[] };
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

  usage(): Observable<UploadUsage> {
    return this.http
      .get<ApiResponse<UploadUsage>>(`${this.endpoint}/usage`)
      .pipe(map((res) => res.data));
  }

  /** Uploaded-file quota + the byte footprint of all the user's data, per module. */
  storage(): Observable<StorageInfo> {
    return this.http
      .get<ApiResponse<StorageInfo>>(`${this.endpoint}/storage`)
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
