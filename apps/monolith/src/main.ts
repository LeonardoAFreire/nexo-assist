import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from '@nexo/shared/config';
import { Logger } from '@nexo/shared/logger';
import { MonolithModule } from './monolith.module.js';

const GLOBAL_PREFIX = 'api';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MonolithModule, { bufferLogs: true });
  const config = app.get(AppConfig);
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableCors({ origin: config.get('WEB_ORIGIN'), credentials: true });
  app.enableShutdownHooks();
  await app.listen(config.get('PORT'));
}

await bootstrap();
