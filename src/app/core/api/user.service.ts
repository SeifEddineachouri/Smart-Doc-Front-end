import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthUserProfile, LanguageCode } from '../models';
import { API_BASE_URL } from './api.constants';
import { AuthStore } from '../state/auth.store';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${API_BASE_URL}/users`;

  public constructor(
    private readonly http: HttpClient,
    private readonly authStore: AuthStore
  ) {}

  getMe(): Observable<AuthUserProfile> {
    return this.http.get<AuthUserProfile>(`${this.baseUrl}/me`).pipe(
      tap((user) => this.authStore.setCurrentUser(user))
    );
  }

  updateLanguage(language: LanguageCode): Observable<AuthUserProfile> {
    return this.http.patch<AuthUserProfile>(`${this.baseUrl}/me/language`, { language }).pipe(
      tap((user) => this.authStore.setCurrentUser(user))
    );
  }
}
