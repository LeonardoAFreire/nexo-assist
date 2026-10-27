import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfig, NexoConfigModule } from '@nexo/shared/config';
import { DATABASE, DatabaseModule, dropSchemas } from '@nexo/shared/database';
import { MonolithModule } from './monolith.module.js';

const DOMAIN_SCHEMAS = ['agent', 'chat', 'tickets', 'knowledge', 'identity'] as const;
const PRODUCTION_ENVIRONMENT = 'production';

@Module({ imports: [NexoConfigModule, DatabaseModule] })
class DropSchemasModule {}

async function dropDomainSchemas(): Promise<void> {
  const context = await NestFactory.createApplicationContext(DropSchemasModule, { logger: false });
  const environment = context.get(AppConfig).get('NODE_ENV');
  if (environment === PRODUCTION_ENVIRONMENT) {
    await context.close();
    throw new Error('db:reset não pode rodar com NODE_ENV=production');
  }
  await dropSchemas(context.get(DATABASE), DOMAIN_SCHEMAS);
  await context.close();
}

async function migrateAndSeed(): Promise<void> {
  const context = await NestFactory.createApplicationContext(MonolithModule, { logger: false });
  await context.close();
}

await dropDomainSchemas();
await migrateAndSeed();
