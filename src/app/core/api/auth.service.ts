import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SignInRequest,
  SignUpRequest
} from '../models';
import { API_BASE_URL } from './api.constants';
import { AuthStore } from '../state/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${API_BASE_URL}/auth`;

  public constructor(
    private readonly http: HttpClient,
    private readonly authStore: AuthStore
  ) {}

  signup(payload: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, payload, { withCredentials: true }).pipe(
      tap((response) => this.applyAuthResponse(response))
    );
  }

  signin(payload: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signin`, payload, { withCredentials: true }).pipe(
      tap((response) => this.applyAuthResponse(response))
    );
  }

  refresh(payload?: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(`${this.baseUrl}/refresh`, payload ?? {}, { withCredentials: true })
      .pipe(tap((response) => this.authStore.setAccessToken(response.accessToken)));
  }

  signout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/signout`, {}, { withCredentials: true });
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.authStore.setAccessToken(response.accessToken);
    this.authStore.setCurrentUser(response.user);
  }
}
