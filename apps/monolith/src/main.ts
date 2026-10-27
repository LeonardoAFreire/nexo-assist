import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from '@nexo/shared/config';
import { Logger } from '@nexo/shared/logger';
import cookieParser from 'cookie-parser';
import { MonolithModule } from './monolith.module.js';

const GLOBAL_PREFIX = 'api';
const BODY_LIMIT = '32kb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MonolithModule, { bufferLogs: true });
  const config = app.get(AppConfig);
  app.useLogger(app.get(Logger));
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.use(cookieParser());
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableCors({ origin: config.get('WEB_ORIGIN'), credentials: true });
  app.enableShutdownHooks();
  await app.listen(config.get('PORT'));
}

await bootstrap();
