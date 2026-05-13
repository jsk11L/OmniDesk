import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        if (
          response !== null &&
          typeof response === 'object' &&
          'data' in (response as Record<string, unknown>)
        ) {
          return response as unknown as ApiResponse<T>;
        }
        return { data: response };
      }),
    );
  }
}
