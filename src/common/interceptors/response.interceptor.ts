/**
 * @file        common/interceptors/response.interceptor.ts
 * @description Global response interceptor that wraps every successful
 *              controller return value in a consistent ApiResponse envelope.
 *              Controllers can return { message, data } to customise the
 *              message field, or return raw data directly.
 * @author      Altaf
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((data: unknown) => {
        const payload = data as { message?: string; data?: T };
        return {
          success: true,
          statusCode,
          message: payload?.message ?? 'Success',
          data: (payload?.data !== undefined ? payload.data : data) as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
