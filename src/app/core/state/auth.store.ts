import { Injectable, computed, signal } from '@angular/core';
import { AuthUserProfile } from '../models';

const TOKEN_KEY = 'smartdoc_access_token';
const USER_KEY = 'smartdoc_current_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly accessTokenSignal = signal<string | null>(this.readToken());
  private readonly currentUserSignal = signal<AuthUserProfile | null>(this.readCurrentUser());
  private readonly refreshInProgressSignal = signal(false);

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly isRefreshingToken = computed(() => this.refreshInProgressSignal());

  setAccessToken(token: string): void {
    this.accessTokenSignal.set(token);
    this.writeStorageItem(TOKEN_KEY, token);
  }

  setCurrentUser(user: AuthUserProfile | null): void {
    this.currentUserSignal.set(user);
    this.writeStorageItem(USER_KEY, user ? JSON.stringify(user) : null);
  }

  setRefreshInProgress(value: boolean): void {
    this.refreshInProgressSignal.set(value);
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.refreshInProgressSignal.set(false);
    this.writeStorageItem(TOKEN_KEY, null);
    this.writeStorageItem(USER_KEY, null);
  }

  private readToken(): string | null {
    return this.readStorageItem(TOKEN_KEY);
  }

  private readCurrentUser(): AuthUserProfile | null {
    const rawValue = this.readStorageItem(USER_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthUserProfile;
    } catch {
      return null;
    }
  }

  private readStorageItem(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  private writeStorageItem(key: string, value: string | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
  }
}
