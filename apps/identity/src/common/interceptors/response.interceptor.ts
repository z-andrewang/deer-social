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
  code: number;
  message: string;
  data: T;
}

interface ReplyWithStatusCode {
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse<ReplyWithStatusCode>();
        const response: ApiResponse<T> = {
          success: true,
          code: res.statusCode || 200,
          message: 'OK',
          data: (data ?? null) as T,
        };
        return response;
      }),
    );
  }
}
