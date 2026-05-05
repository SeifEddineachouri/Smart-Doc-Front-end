import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatSession } from '../models';
import { API_BASE_URL } from './api.constants';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly baseUrl = `${API_BASE_URL}/sessions`;

  public constructor(private readonly http: HttpClient) {}

  list(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(this.baseUrl);
  }

  create(name?: string): Observable<ChatSession> {
    return this.http.post<ChatSession>(this.baseUrl, name ? { name } : {});
  }

  archive(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${sessionId}`);
  }
}
