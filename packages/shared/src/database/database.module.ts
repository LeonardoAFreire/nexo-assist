import { Global, Logger, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppConfig } from '../config/app-config.service.js';
import { DatabasePoolCloser } from './database-pool.closer.js';
import { DATABASE, DATABASE_POOL } from './database.tokens.js';

const MAX_POOL_CONNECTIONS = 10;

function createPool(config: AppConfig): Pool {
  const pool = new Pool({
    connectionString: config.get('DATABASE_URL'),
    max: MAX_POOL_CONNECTIONS,
  });
  const logger = new Logger('database');
  pool.on('error', (error: Error) => logger.error(`Conexão ociosa falhou: ${error.message}`));
  return pool;
}

@Global()
@Module({
  providers: [
    { provide: DATABASE_POOL, inject: [AppConfig], useFactory: createPool },
    {
      provide: DATABASE,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool) => drizzle({ client: pool }),
    },
    DatabasePoolCloser,
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
