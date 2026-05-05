import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AskQuestionRequest, AskQuestionResponse, ChatHistoryResponse } from '../models';
import { API_BASE_URL } from './api.constants';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly baseUrl = `${API_BASE_URL}/ai`;

  public constructor(private readonly http: HttpClient) {}

  askQuestion(payload: AskQuestionRequest, sessionId?: string): Observable<AskQuestionResponse> {
    const params = sessionId ? new HttpParams().set('sessionId', sessionId) : undefined;
    return this.http.post<AskQuestionResponse>(`${this.baseUrl}/questions`, payload, { params });
  }

  getHistory(page = 0, size = 20, sessionId?: string): Observable<ChatHistoryResponse> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sessionId) {
      params = params.set('sessionId', sessionId);
    }
    return this.http.get<ChatHistoryResponse>(`${this.baseUrl}/history`, { params });
  }
}
