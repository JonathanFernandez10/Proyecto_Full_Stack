import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';

import { AuthService } from '../services/auth.service';

import {
  catchError,
  throwError,
  switchMap,
  tap
} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const token = authService.getAccessToken();

  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        console.log('Interceptor detectó un 401 Unauthorized');
      }

      return throwError(() => error);

    })
  );

};