import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  public constructor(private readonly authStore: AuthStore) {}

  clear(): void {
    this.authStore.clearSession();
  }
}
