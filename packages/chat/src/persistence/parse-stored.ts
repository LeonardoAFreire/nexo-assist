import type { ZodType } from 'zod';
import { CorruptedRecordError } from './corrupted-record.error.js';

export type ParseStoredInput<T> = {
  schema: ZodType<T>;
  value: unknown;
  origin: string;
};

export function parseStored<T>(input: ParseStoredInput<T>): T {
  const result = input.schema.safeParse(input.value);
  if (!result.success) {
    throw new CorruptedRecordError(input.origin, result.error);
  }
  return result.data;
}

export function toIso(date: Date | null): string | null {
  return date === null ? null : date.toISOString();
}

export function toDate(iso: string | null): Date | null {
  return iso === null ? null : new Date(iso);
}
