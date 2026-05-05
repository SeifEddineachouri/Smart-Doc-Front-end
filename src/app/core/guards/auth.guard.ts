import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { AuthService } from '../api/auth.service';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return authService.refresh().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/sign-in'])))
  );
};
