import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadedDocument } from '../models';
import { API_BASE_URL } from './api.constants';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly baseUrl = `${API_BASE_URL}/documents`;

  public constructor(private readonly http: HttpClient) {}

  upload(file: File, sessionId?: string): Observable<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', file);
    const params = sessionId ? new HttpParams().set('sessionId', sessionId) : undefined;

    return this.http.post<UploadedDocument>(`${this.baseUrl}/upload`, formData, { params });
  }

  list(sessionId?: string): Observable<UploadedDocument[]> {
    const params = sessionId ? new HttpParams().set('sessionId', sessionId) : undefined;
    return this.http.get<UploadedDocument[]>(this.baseUrl, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
