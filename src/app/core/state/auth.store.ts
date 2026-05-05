import { Injectable, computed, signal } from '@angular/core';
import { AuthUserProfile } from '../models';

const TOKEN_KEY = 'smartdoc_access_token';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly accessTokenSignal = signal<string | null>(this.readToken());
  private readonly currentUserSignal = signal<AuthUserProfile | null>(null);
  private readonly refreshInProgressSignal = signal(false);

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly isRefreshingToken = computed(() => this.refreshInProgressSignal());

  setAccessToken(token: string): void {
    this.accessTokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  setCurrentUser(user: AuthUserProfile | null): void {
    this.currentUserSignal.set(user);
  }

  setRefreshInProgress(value: boolean): void {
    this.refreshInProgressSignal.set(value);
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.refreshInProgressSignal.set(false);
    localStorage.removeItem(TOKEN_KEY);
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
