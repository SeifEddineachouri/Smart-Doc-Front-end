import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiErrorResponse } from '../models';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const apiError = error.error as ApiErrorResponse;
      const normalized = {
        status: error.status,
        code: apiError?.code ?? 'UNKNOWN_ERROR',
        message: apiError?.message ?? 'An unexpected error occurred.',
        fieldErrors: apiError?.fieldErrors ?? []
      };

      return throwError(() => normalized);
    })
  );
