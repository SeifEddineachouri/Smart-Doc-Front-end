import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.constants';
import { AuthService } from '../api/auth.service';
import { AuthStore } from '../state/auth.store';

const PUBLIC_ENDPOINTS = ['/auth/signup', '/auth/signin', '/auth/refresh'];
const RETRY_HEADER = 'x-refresh-attempt';

const isApiRequest = (url: string): boolean => url.startsWith(API_BASE_URL);

const isPublicEndpoint = (url: string): boolean => PUBLIC_ENDPOINTS.some((path) => url.includes(path));

let refreshInProgress = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const isProtectedApiCall = isApiRequest(req.url) && !isPublicEndpoint(req.url);
      const alreadyRetried = req.headers.has(RETRY_HEADER);

      if (error.status !== 401 || !isProtectedApiCall || alreadyRetried) {
        return throwError(() => error);
      }

      if (!refreshInProgress) {
        refreshInProgress = true;
        authStore.setRefreshInProgress(true);
        refreshTokenSubject.next(null);

        return authService.refresh().pipe(
          switchMap((response) => {
            const refreshedToken = response.accessToken;
            refreshTokenSubject.next(refreshedToken);

            return next(
              req.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshedToken}`,
                  [RETRY_HEADER]: '1'
                }
              })
            );
          }),
          catchError((refreshError) => {
            authStore.clearSession();
            router.navigate(['/sign-in']);
            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshInProgress = false;
            authStore.setRefreshInProgress(false);
          })
        );
      }

      return waitForTokenAndRetry(req, next);
    })
  );
};

function waitForTokenAndRetry(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) =>
      next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            [RETRY_HEADER]: '1'
          }
        })
      )
    )
  );
}
