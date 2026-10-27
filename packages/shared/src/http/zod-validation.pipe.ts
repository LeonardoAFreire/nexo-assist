import { HttpStatus, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ApiHttpException } from './api-http.exception.js';

export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ApiHttpException({
        code: 'validation_error',
        message: result.error.issues.map((issue) => issue.message).join('; '),
        status: HttpStatus.BAD_REQUEST,
      });
    }
    return result.data;
  }
}
