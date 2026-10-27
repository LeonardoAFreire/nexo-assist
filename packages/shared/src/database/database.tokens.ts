import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

export const DATABASE = Symbol('DATABASE');
export const DATABASE_POOL = Symbol('DATABASE_POOL');

export type Database = PgDatabase<PgQueryResultHKT>;
