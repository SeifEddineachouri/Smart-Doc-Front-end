import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../api/api.constants';
import { AuthStore } from '../state/auth.store';

const PUBLIC_ENDPOINTS = ['/auth/signup', '/auth/signin', '/auth/refresh'];

const isApiRequest = (url: string): boolean => url.startsWith(API_BASE_URL);

const isPublicEndpoint = (url: string): boolean => PUBLIC_ENDPOINTS.some((path) => url.includes(path));

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  if (!isApiRequest(req.url) || isPublicEndpoint(req.url)) {
    return next(req);
  }

  const token = authStore.accessToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
