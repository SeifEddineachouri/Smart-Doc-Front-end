import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { UserService } from '../api/user.service';

const hasAdminFlag = (user: { admin?: boolean; isAdmin?: boolean } | null | undefined): boolean =>
	typeof user?.admin === 'boolean' || typeof user?.isAdmin === 'boolean';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const userService = inject(UserService);
  const router = inject(Router);

  const currentUser = authStore.currentUser();

  if (authStore.isAuthenticated() && currentUser?.id && hasAdminFlag(currentUser)) {
    return true;
  }

  return userService.getMe().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/sign-in'])))
  );
};
