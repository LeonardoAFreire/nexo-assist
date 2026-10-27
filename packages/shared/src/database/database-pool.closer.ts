import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from './database.tokens.js';

@Injectable()
export class DatabasePoolCloser implements OnApplicationShutdown {
  private closing: Promise<void> | undefined;

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  onApplicationShutdown(): Promise<void> {
    this.closing ??= this.pool.end();
    return this.closing;
  }
}
